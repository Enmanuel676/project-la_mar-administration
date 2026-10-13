import { TRASH_DAYS } from '../../lib/api'
import DoneButton from '../DoneButton/DoneButton'

export default function ConfirmDialog({ confirm, onCancel, onConfirm }) {
  if (!confirm) return null
  // Mientras se borra (y mientras el botón pasa a «Hecho») el diálogo no se puede cerrar.
  const { article, permanent, busy, done } = confirm

  return (
    <div
      className="confirm"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
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
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <DoneButton
            className={'btn-danger' + (busy ? ' is-busy' : '')}
            disabled={busy}
            done={done}
            onClick={onConfirm}
            type="button"
          >
            {busy
              ? permanent
                ? 'Borrando…'
                : 'Eliminando…'
              : permanent
                ? 'Borrar'
                : 'Eliminar'}
          </DoneButton>
        </div>
      </div>
    </div>
  )
}
