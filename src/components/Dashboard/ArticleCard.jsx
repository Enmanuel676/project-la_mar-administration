import DoneButton from '../DoneButton/DoneButton'
import Money from './Money'

const badgeClass = (published) => 'badge' + (published ? ' badge-on' : '')
const badgeLabel = (published) => (published ? 'Publicado' : 'Borrador')

export default function ArticleCard({
  article,
  status,
  onEdit,
  onTogglePublished,
  onDelete,
}) {
  // Mientras se publica o se pasa a borrador la tarjeta no responde y la etiqueta se apaga;
  // al terminar, el estado nuevo aparece en píxeles sobre ella.
  const busy = !!status

  return (
    <article className="card" data-id={article.id}>
      <button
        className="card__main"
        disabled={busy}
        onClick={onEdit}
        type="button"
      >
        <div className="card__thumb">
          {article.image ? (
            <img alt="" src={article.image} />
          ) : (
            <span className="material-symbols-outlined">diamond</span>
          )}
        </div>
        <div className="card__info">
          <span className="card__meta">
            {article.category}
            {article.collection ? ' · ' + article.collection : ''}
          </span>
          <span className="card__name">{article.name}</span>
          <span className="card__price">
            <Money article={article} />
          </span>
          <span className="card__stock">
            {' '}
            · Stock{' '}
            {article.stock == null || article.stock === ''
              ? '—'
              : article.stock}
          </span>
        </div>
      </button>
      <div className="card__side">
        <DoneButton
          className={badgeClass(article.published)}
          disabled={busy}
          done={status === 'done'}
          doneClassName={badgeClass(!article.published)}
          doneContent={badgeLabel(!article.published)}
          onClick={onTogglePublished}
          type="button"
        >
          {badgeLabel(article.published)}
        </DoneButton>
        <button
          aria-label={'Eliminar ' + article.name}
          className="icon-btn icon-btn--sm icon-btn--danger"
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            delete
          </span>
        </button>
      </div>
    </article>
  )
}
