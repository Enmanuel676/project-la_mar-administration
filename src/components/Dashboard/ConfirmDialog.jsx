import { useEffect } from 'react'
import DoneButton from '../DoneButton/DoneButton'

export default function ConfirmDialog({
  confirm,
  onCancel,
  onConfirm,
  retentionDays,
}) {
  // Mientras se borra (y mientras el botón pasa a «Hecho») el diálogo no se puede cerrar.
  const locked = !confirm || !!confirm.busy

  // Esc cierra el diálogo, igual que la cruz, «Cancelar» o tocar fuera. El listener solo
  // existe mientras el diálogo está abierto y se puede cerrar, y se quita al cerrarse.
  useEffect(() => {
    if (locked) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [locked, onCancel])

  if (!confirm) return null
  const { article, permanent, busy, done } = confirm

  return (
    <div
      className="confirm"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        aria-describedby="confirm-text"
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="confirm__sheet"
        role="dialog"
      >
        <div className="confirm__grip" />
        <button
          aria-label="Cerrar"
          className="icon-btn icon-btn--sm confirm__close"
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            close
          </span>
        </button>
        <h2 className="admin__title" id="confirm-title">
          {permanent ? '¿Borrar definitivamente?' : '¿Eliminar artículo?'}
        </h2>
        <p className="confirm__text" id="confirm-text">
          {permanent
            ? '«' +
              article.name +
              '» se borrará para siempre. Esta acción no se puede deshacer.'
            : '«' +
              article.name +
              '» se quitará del catálogo y pasará a Eliminados, donde podrás restaurarlo' +
              (retentionDays
                ? ' durante ' + retentionDays + ' días.'
                : ' antes de su borrado automático.')}
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
