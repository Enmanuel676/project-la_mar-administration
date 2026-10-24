import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { getUser, updateSessionUser } from '../../lib/session'
import { DONE_MS } from '../DoneButton/DoneButton'
import CatalogView from './CatalogView'
import ArticleFormView from './ArticleFormView'
import ConfirmDialog from './ConfirmDialog'
import Toasts from './Toasts'
import Register from '../Register/Register'
import UsersView from '../UsersView/UsersView'

// Las acciones cambian la lista cuando su botón ya ha pasado a «Hecho» (DoneButton): antes,
// la tarjeta o el diálogo desaparecerían sin que se viera la transición. Se espera aquí y no
// en el botón para que el cambio llegue aunque la tarjeta deje de verse mientras tanto (por
// ejemplo, al cambiar de filtro).
function settle() {
  return new Promise((resolve) => setTimeout(resolve, DONE_MS))
}

export default function Dashboard({ onLogout, currentUser }) {
  const [articles, setArticles] = useState([])
  const [deleted, setDeleted] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState('catalog') // 'catalog' | 'form' | 'register' | 'users'
  // Un usuario es admin por su email O por su rol
  const isAdmin =
    currentUser &&
    (currentUser.isAdmin ||
      (currentUser.email &&
        ['darelisbatistag@gmail.com', 'enmanuel676hd@gmail.com'].includes(
          currentUser.email.toLowerCase().trim(),
        )))
  const [editingId, setEditingId] = useState(null)
  const [confirm, setConfirm] = useState(null) // { article, permanent, busy, done }
  // Tarjetas que se están publicando o restaurando: { [id]: 'busy' | 'done' }
  const [pending, setPending] = useState({})
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
        // Una sesión caducada ya la resuelve App (vuelve al login con el aviso).
        if (ignore) return
        pushToast(ex.message, 'error')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [pushToast])

  // Sincronizar la sesión cada 60 segundos: si un admin cambió el rol del usuario
  // actual, se actualiza la sesión y se avisa para que recargue la página.
  useEffect(() => {
    const interval = setInterval(() => {
      api
        .getMe()
        .then((freshUser) => {
          const current = getUser()
          if (
            current &&
            (current.role !== freshUser.role ||
              current.isAdmin !== freshUser.isAdmin)
          ) {
            updateSessionUser(freshUser)
            pushToast(
              'Tus permisos han cambiado. Recarga la página para aplicarlos.',
              'info',
            )
          }
        })
        .catch(() => {
          // Ignorar errores de sincronización
        })
    }, 60000) // 60 segundos
    return () => clearInterval(interval)
  }, [pushToast])

  const editingArticle = editingId
    ? articles.find((a) => a.id === editingId) || null
    : null

  function openForm(article) {
    setEditingId(article ? article.id : null)
    setView('form')
  }

  function openRegister() {
    setView('register')
  }

  function openUsers() {
    setView('users')
  }

  function handleRegisterSuccess() {
    pushToast('Usuario registrado correctamente')
    setView('catalog')
  }

  function setStatus(id, status) {
    setPending((map) => {
      const next = { ...map }
      if (status) next[id] = status
      else delete next[id]
      return next
    })
  }

  async function togglePublished(article) {
    setStatus(article.id, 'busy')
    try {
      const updated = await api.update(article.id, {
        published: !article.published,
      })
      pushToast(updated.published ? 'Artículo publicado' : 'Pasado a borrador')
      setStatus(article.id, 'done')
      await settle()
      setArticles((list) =>
        list.map((a) => (a.id === updated.id ? updated : a)),
      )
    } catch (ex) {
      pushToast(ex.message, 'error')
    }
    setStatus(article.id, null)
  }

  async function restoreArticle(article) {
    setStatus(article.id, 'busy')
    try {
      const restored = await api.restore(article.id)
      pushToast('Artículo restaurado como borrador')
      setStatus(article.id, 'done')
      await settle()
      setDeleted((list) => list.filter((a) => a.id !== article.id))
      setArticles((list) => [restored, ...list])
    } catch (ex) {
      pushToast(ex.message, 'error')
    }
    setStatus(article.id, null)
  }

  function requestDelete(article, permanent) {
    setConfirm({ article, permanent: !!permanent })
  }

  async function handleConfirm() {
    if (!confirm) return
    const { article, permanent } = confirm
    setConfirm({ article, permanent, busy: true })
    try {
      if (permanent) await api.destroy(article.id)
      else await api.remove(article.id)
    } catch (ex) {
      pushToast(ex.message, 'error')
      setConfirm({ article, permanent })
      return
    }
    pushToast(
      permanent ? 'Artículo borrado definitivamente' : 'Movido a Eliminados',
    )
    setConfirm({ article, permanent, busy: true, done: true })
    // Hasta aquí el artículo sigue en la lista: si saliera antes, el formulario de edición que
    // queda detrás del diálogo se vaciaría mientras se ve «Hecho».
    await settle()
    if (permanent) {
      setDeleted((list) => list.filter((a) => a.id !== article.id))
    } else {
      setArticles((list) => list.filter((a) => a.id !== article.id))
      setDeleted((list) => [
        { ...article, published: false, deletedAt: Date.now() },
        ...list,
      ])
    }
    setConfirm(null)
    setView((v) => (v === 'form' ? 'catalog' : v))
  }

  // El formulario vuelve al catálogo él mismo, cuando su botón ya muestra «Hecho».
  async function saveArticle(data, onProgress) {
    if (editingId) {
      const updated = await api.update(editingId, data, onProgress)
      setArticles((list) =>
        list.map((a) => (a.id === updated.id ? updated : a)),
      )
      pushToast('Cambios guardados')
    } else {
      const created = await api.create(data, onProgress)
      setArticles((list) => [created, ...list])
      pushToast('Artículo añadido')
    }
  }

  return (
    <>
      {view === 'catalog' ? (
        <CatalogView
          articles={articles}
          currentUser={currentUser}
          deleted={deleted}
          filter={filter}
          loading={loading}
          isAdmin={isAdmin}
          onAdd={() => openForm(null)}
          onDelete={(a) => requestDelete(a, false)}
          onDestroy={(a) => requestDelete(a, true)}
          onEdit={openForm}
          onFilterChange={setFilter}
          onLogout={onLogout}
          onQueryChange={setQuery}
          onRegister={openRegister}
          onUsers={openUsers}
          onRestore={restoreArticle}
          onTogglePublished={togglePublished}
          pending={pending}
          query={query}
        />
      ) : view === 'users' ? (
        <UsersView
          onBack={() => setView('catalog')}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
      ) : view === 'register' ? (
        <Register
          onRegister={handleRegisterSuccess}
          onBackToLogin={() => setView('catalog')}
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
