import { TRASH_DAYS } from '../../lib/api'

export default function ConfirmDialog({ confirm, onCancel, onConfirm }) {
  if (!confirm) return null
  const { article, permanent } = confirm

  return (
    <div
      className="confirm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="confirm__sheet">
        <div className="confirm__grip" />
        <h2 className="admin__title">
          {permanent ? '¿Borrar definitivamente?' : '¿Eliminar artículo?'}
        </h2>
        <p className="confirm__text">
          {permanent
            ? '«' +
              article.name +
              '» se borrará para siempre. Esta acción no se puede deshacer.'
            : '«' +
              article.name +
              '» se quitará del catálogo y pasará a Eliminados, donde podrás restaurarlo durante ' +
              TRASH_DAYS +
              ' días.'}
        </p>
        <div className="confirm__actions">
          <button className="btn-ghost" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} type="button">
            {permanent ? 'Borrar' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
