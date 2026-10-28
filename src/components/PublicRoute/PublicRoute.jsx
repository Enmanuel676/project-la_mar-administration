import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/hooks'
import LoadingView from '../LoadingView/LoadingView'

/**
 * Componente que protege rutas públicas (como signin, signup).
 * Si el usuario YA está autenticado, lo redirige al dashboard (/).
 * Si no está autenticado, muestra el componente hijo (element).
 *
 * Uso: <Route path="/signin" element={<PublicRoute element={<Login />} />} />
 */
export default function PublicRoute({ element }) {
  const { isAuthenticated, loading } = useAuth()

  // Mostrar animación skeleton mientras se verifica la autenticación
  if (loading) {
    return <LoadingView />
  }

  // Si hay sesión válida, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return element
}
