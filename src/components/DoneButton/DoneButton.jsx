import { useEffectEvent, useLayoutEffect, useRef } from 'react'
import {
  CELL,
  createSurface,
  prefersReducedMotion,
  renderSurface,
} from '../../lib/pixelDissolve'

// Lo que tarda la cara nueva en aparecer (lo mismo que el menú móvil del frontend) y lo que
// se queda a la vista antes de seguir. Dashboard espera DONE_MS para cambiar la lista.
export const REVEAL_MS = 520
export const HOLD_MS = 600
export const DONE_MS = REVEAL_MS + HOLD_MS

function DoneFace({ className, onDone, children }) {
  const faceRef = useRef(null)
  const fxRef = useRef(null)
  const finish = useEffectEvent(() => onDone?.())

  // useLayoutEffect: la cara se oculta antes de que el navegador llegue a pintarla.
  useLayoutEffect(() => {
    const face = faceRef.current
    const height = face.offsetHeight
    // Celdas de 14 px como mucho, como en las tarjetas, en al menos 4 filas que llenan justo
    // el alto: 12 px en un botón de 48 y 5 en la etiqueta Publicado/Borrador. El desenfoque
    // de las tarjetas (4 px) también se reduce en lo pequeño, o emborronaría la etiqueta.
    const rows = Math.max(4, Math.ceil(height / CELL))
    const surface = createSurface(face, fxRef.current, {
      cell: Math.max(2, Math.ceil(height / rows)),
      maxBlur: Math.min(4, height / 10),
    })
    let frame = null
    let timer = null
    let start = null

    const show = (reveal) => {
      const state = renderSurface(surface, reveal)
      face.style.visibility = state === 'hidden' ? 'hidden' : ''
    }
    const hold = () => {
      timer = setTimeout(() => finish(), HOLD_MS)
    }
    const step = (now) => {
      if (start === null) start = now
      const reveal = Math.min(1, (now - start) / REVEAL_MS)
      show(reveal)
      if (reveal < 1) frame = requestAnimationFrame(step)
      else hold()
    }

    if (prefersReducedMotion()) {
      show(1)
      hold()
    } else {
      show(0)
      frame = requestAnimationFrame(step)
    }
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [])

  return (
    <span
      aria-hidden="true"
      className={className + ' done-btn__face'}
      ref={faceRef}
    >
      {children}
      <canvas className="done-btn__fx" ref={fxRef} />
    </span>
  )
}

/**
 * Botón con estados. Mientras `done` es falso es un <button> normal: quien lo usa decide su
 * aspecto y su texto («Cargando…», «Eliminando…»). Cuando `done` pasa a verdadero, la cara
 * «Hecho» (o `doneContent`, con la clase `doneClassName`) aparece encima en píxeles, igual
 * que las tarjetas del frontend al hacer scroll, y al terminar se llama a `onDone`.
 * La cara va fuera del botón, en un envoltorio que ocupa su sitio, para no heredar la
 * opacidad de `.is-busy`: debajo, el botón se queda como estaba.
 */
export default function DoneButton({
  done,
  doneClassName = 'btn-primary',
  doneContent,
  onDone,
  children,
  ...props
}) {
  return (
    <span className="done-btn">
      <button {...props}>{children}</button>
      {done && (
        <DoneFace className={doneClassName} onDone={onDone}>
          {doneContent || (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                check
              </span>
              <span>Hecho</span>
            </>
          )}
        </DoneFace>
      )}
    </span>
  )
}
