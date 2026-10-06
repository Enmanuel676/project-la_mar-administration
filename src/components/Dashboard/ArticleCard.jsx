import Money from './Money'

export default function ArticleCard({
  article,
  onEdit,
  onTogglePublished,
  onDelete,
}) {
  return (
    <article className="card" data-id={article.id}>
      <button className="card__main" onClick={onEdit} type="button">
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
        <button
          className={'badge' + (article.published ? ' badge-on' : '')}
          onClick={onTogglePublished}
          type="button"
        >
          {article.published ? 'Publicado' : 'Borrador'}
        </button>
        <button
          aria-label={'Eliminar ' + article.name}
          className="icon-btn icon-btn--sm icon-btn--danger"
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
