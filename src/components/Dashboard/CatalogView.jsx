import ArticleCard from './ArticleCard'
import TrashCard from './TrashCard'
import { useCurrentUser } from '../CurrentUserContext/CurrentUserContext'

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'published', label: 'Publicados' },
  { key: 'trash', label: 'Eliminados', trash: true },
  { key: 'draft', label: 'Borradores' },
]

export default function CatalogView({
  articles,
  deleted,
  retentionDays,
  pending,
  loading,
  filter,
  query,
  isAdmin,
  onFilterChange,
  onQueryChange,
  onLogout,
  onAdd,
  onEdit,
  onTogglePublished,
  onDelete,
  onRestore,
  onDestroy,
  onRegister,
  onUsers,
}) {
  const currentUser = useCurrentUser()
  const counts = {
    all: articles.length,
    published: articles.filter((a) => a.published).length,
    draft: articles.filter((a) => !a.published).length,
    trash: deleted.length,
  }

  const inTrash = filter === 'trash'
  const q = query.trim().toLowerCase()
  const source = inTrash ? deleted : articles
  const list = source.filter((a) => {
    if (filter === 'published' && !a.published) return false
    if (filter === 'draft' && a.published) return false
    if (!q) return true
    return (
      [a.name, a.collection, a.category, a.materials]
        .join(' ')
        .toLowerCase()
        .indexOf(q) >= 0
    )
  })

  return (
    <section className="admin__view admin__view--catalog" id="view-catalog">
      <header className="topbar">
        <div className="topbar__row">
          <div>
            <span className="admin__kicker">La Mar · Admin</span>
            {currentUser && currentUser.name && (
              <p className="topbar__greeting">Hola, {currentUser.name}</p>
            )}
            <h1 className="admin__title">Catálogo</h1>
          </div>
          <div className="topbar__actions">
            {isAdmin && (
              <button
                aria-label="Administrar usuarios"
                className="icon-btn"
                onClick={onUsers}
                title="Administrar usuarios"
                type="button"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  group
                </span>
              </button>
            )}
            {isAdmin && (
              <button
                aria-label="Registrar usuario"
                className="icon-btn"
                onClick={onRegister}
                title="Registrar usuario"
                type="button"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  person_add
                </span>
              </button>
            )}
            <button
              aria-label="Cerrar sesión"
              className="icon-btn"
              onClick={onLogout}
              type="button"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                logout
              </span>
            </button>
          </div>
        </div>
        <div className="search">
          <span className="material-symbols-outlined search__icon">search</span>
          <input
            className="field"
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar artículo…"
            type="search"
            value={query}
          />
        </div>
        <div className="filters" role="tablist">
          {FILTERS.map((f) => (
            <button
              className={
                'chip' +
                (f.trash ? ' chip-trash' : '') +
                (filter === f.key ? ' is-active' : '')
              }
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              type="button"
            >
              {f.trash && (
                <span className="material-symbols-outlined">
                  delete_history
                </span>
              )}
              {f.label} <span>{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </header>

      {inTrash && (
        <div className="trash-info" id="trash-info">
          <span className="material-symbols-outlined">schedule</span>
          <p>
            {retentionDays ? (
              <>
                Los artículos eliminados se guardan{' '}
                <strong>{retentionDays} días</strong>.
              </>
            ) : (
              'El plazo de conservación no está disponible en este momento.'
            )}{' '}
            Puedes restaurarlos o borrarlos definitivamente; pasado ese plazo se
            eliminan solos.
          </p>
        </div>
      )}

      <div aria-live="polite" className="article-list" id="article-list">
        {loading ? (
          <>
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </>
        ) : (
          list.map((a) =>
            inTrash ? (
              <TrashCard
                article={a}
                retentionDays={retentionDays}
                key={a.id}
                onDestroy={() => onDestroy(a)}
                onRestore={() => onRestore(a)}
                status={pending[a.id]}
              />
            ) : (
              <ArticleCard
                article={a}
                key={a.id}
                onDelete={() => onDelete(a)}
                onEdit={() => onEdit(a)}
                onTogglePublished={() => onTogglePublished(a)}
                status={pending[a.id]}
              />
            ),
          )
        )}
      </div>

      {!loading && list.length === 0 && (
        <div className="empty" id="empty-state">
          <span className="material-symbols-outlined">inventory_2</span>
          <p className="empty__title">Sin artículos</p>
          <p className="empty__text">
            {inTrash
              ? 'La papelera está vacía.'
              : 'Pulsa «Añadir» para crear el primero.'}
          </p>
        </div>
      )}

      {!inTrash && (
        <button
          className="btn-primary fab"
          id="add-btn"
          onClick={onAdd}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            add
          </span>
          <span>Añadir artículo</span>
        </button>
      )}
    </section>
  )
}
