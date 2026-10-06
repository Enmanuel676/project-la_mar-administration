import Money from './Money'
import { DAY_MS, TRASH_DAYS } from '../../lib/api'

function daysLeft(article) {
  return Math.max(
    0,
    Math.ceil(
      (new Date(article.deletedAt).getTime() +
        TRASH_DAYS * DAY_MS -
        Date.now()) /
        DAY_MS,
    ),
  )
}

export default function TrashCard({ article, onRestore, onDestroy }) {
  const left = daysLeft(article)
  const pct = Math.round((left / TRASH_DAYS) * 100)
  const deletedOn = new Date(article.deletedAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <article className="card card-trash" data-id={article.id}>
      <div className="card-trash__head">
        <div className="card__thumb">
          {article.image ? (
            <img alt="" src={article.image} />
          ) : (
            <span className="material-symbols-outlined">diamond</span>
          )}
        </div>
        <div className="card-trash__info">
          <span className="card__name">{article.name}</span>
          <span className="card-trash__date">
            Eliminado el {deletedOn} · <Money article={article} />
          </span>
        </div>
        <span className={'badge' + (left <= 5 ? ' badge-warn' : '')}>
          {left === 1 ? '1 día' : left + ' días'}
        </span>
      </div>
      <div className="card-trash__bar">
        <div
          className={left <= 5 ? 'is-warn' : ''}
          style={{ width: pct + '%' }}
        />
      </div>
      <div className="card-trash__actions">
        <button className="btn-ghost btn-sm" onClick={onRestore} type="button">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            restore_from_trash
          </span>
          Restaurar
        </button>
        <button
          aria-label={'Borrar definitivamente ' + article.name}
          className="btn-danger btn-sm"
          onClick={onDestroy}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            delete_forever
          </span>
        </button>
      </div>
    </article>
  )
}
