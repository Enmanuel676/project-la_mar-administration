import { useEffect, useState } from 'react'
import './PageLoader.css'

/**
 * Pop-up de carga modal centrado en pantalla con efecto de desenfoque (blur)
 * y spinner circular. Diseño adaptado del frontend principal para el panel de administración.
 */
function PageLoader({ isLoading, title = 'Cargando' }) {
  const [mounted, setMounted] = useState(isLoading)

  // Al empezar a cargar se monta en el mismo render (sin pasar por un efecto).
  if (isLoading && !mounted) setMounted(true)

  // Al terminar de cargar sigue montado mientras dura la animación de salida.
  const isClosing = mounted && !isLoading

  useEffect(() => {
    if (!isClosing) return
    const timer = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(timer)
  }, [isClosing])

  if (!mounted) return null

  return (
    <div
      className={`page-loader__overlay${isClosing ? ' page-loader__overlay--closing' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="page-loader__modal">
        <div className="page-loader__spinner" aria-hidden="true" />
        <h2 className="page-loader__title">{title}</h2>
      </div>
    </div>
  )
}

export default PageLoader
