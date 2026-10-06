import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import CatalogView from './CatalogView'
import ArticleFormView from './ArticleFormView'
import ConfirmDialog from './ConfirmDialog'
import Toasts from './Toasts'

export default function Dashboard({ onLogout }) {
  const [articles, setArticles] = useState([])
  const [deleted, setDeleted] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState('catalog') // 'catalog' | 'form'
  const [editingId, setEditingId] = useState(null)
  const [confirm, setConfirm] = useState(null) // { article, permanent }
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((msg, kind) => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list, { id, msg, kind, leaving: false }])
    setTimeout(() => {
      setToasts((list) =>
        list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      )
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id))
      }, 300)
    }, 2400)
  }, [])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const [list, trash] = await Promise.all([api.list(), api.listDeleted()])
        if (ignore) return
        setArticles(list)
        setDeleted(trash)
      } catch (ex) {
        if (ignore) return
        pushToast(ex.message, 'error')
        if (ex.message.indexOf('Sesión') >= 0) onLogout()
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [onLogout, pushToast])

  const editingArticle = editingId
    ? articles.find((a) => a.id === editingId) || null
    : null

  function openForm(article) {
    setEditingId(article ? article.id : null)
    setView('form')
  }

  async function togglePublished(article) {
    try {
      const updated = await api.update(article.id, {
        published: !article.published,
      })
      setArticles((list) =>
        list.map((a) => (a.id === updated.id ? updated : a)),
      )
      pushToast(updated.published ? 'Artículo publicado' : 'Pasado a borrador')
    } catch (ex) {
      pushToast(ex.message, 'error')
    }
  }

  async function restoreArticle(article) {
    try {
      const restored = await api.restore(article.id)
      setDeleted((list) => list.filter((a) => a.id !== article.id))
      setArticles((list) => [restored, ...list])
      pushToast('Artículo restaurado como borrador')
    } catch (ex) {
      pushToast(ex.message, 'error')
    }
  }

  function requestDelete(article, permanent) {
    setConfirm({ article, permanent: !!permanent })
  }

  async function handleConfirm() {
    if (!confirm) return
    const { article, permanent } = confirm
    try {
      if (permanent) {
        await api.destroy(article.id)
        setDeleted((list) => list.filter((a) => a.id !== article.id))
        pushToast('Artículo borrado definitivamente')
      } else {
        await api.remove(article.id)
        setArticles((list) => list.filter((a) => a.id !== article.id))
        setDeleted((list) => [
          { ...article, published: false, deletedAt: Date.now() },
          ...list,
        ])
        pushToast('Movido a Eliminados')
      }
      setConfirm(null)
      setView((v) => (v === 'form' ? 'catalog' : v))
    } catch (ex) {
      pushToast(ex.message, 'error')
    }
  }

  async function saveArticle(data) {
    if (editingId) {
      const updated = await api.update(editingId, data)
      setArticles((list) =>
        list.map((a) => (a.id === updated.id ? updated : a)),
      )
      pushToast('Cambios guardados')
    } else {
      const created = await api.create(data)
      setArticles((list) => [created, ...list])
      pushToast('Artículo añadido')
    }
    setView('catalog')
  }

  return (
    <>
      {view === 'catalog' ? (
        <CatalogView
          articles={articles}
          deleted={deleted}
          filter={filter}
          loading={loading}
          onAdd={() => openForm(null)}
          onDelete={(a) => requestDelete(a, false)}
          onDestroy={(a) => requestDelete(a, true)}
          onEdit={openForm}
          onFilterChange={setFilter}
          onLogout={onLogout}
          onQueryChange={setQuery}
          onRestore={restoreArticle}
          onTogglePublished={togglePublished}
          query={query}
        />
      ) : (
        <ArticleFormView
          key={editingArticle ? editingArticle.id : 'new'}
          article={editingArticle}
          onBack={() => setView('catalog')}
          onDelete={
            editingArticle ? () => requestDelete(editingArticle, false) : null
          }
          onSave={saveArticle}
        />
      )}
      <ConfirmDialog
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
      <Toasts toasts={toasts} />
    </>
  )
}
