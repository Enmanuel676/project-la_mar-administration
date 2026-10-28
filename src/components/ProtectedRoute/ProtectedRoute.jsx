import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthProvider/hooks'
import LoadingView from '../LoadingView/LoadingView'

/**
 * Componente que protege rutas que requieren autenticación.
 * Si no hay sesión, redirige a /.
 *
 * Props:
 * - element: Elemento React a renderizar si está autenticado
 * - roles: Array opcional de roles permitidos (ej: ['admin']). Si no se proporciona, cualquier usuario autenticado puede acceder.
 *
 * Uso:
 * <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
 * <Route path="/admin" element={<ProtectedRoute roles={['admin']} element={<AdminPanel />} />} />
 */
export default function ProtectedRoute({ element, roles }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  // Mostrar animación skeleton mientras se verifica la autenticación
  if (loading) {
    return <LoadingView />
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Si hay roles especificados, verificar que el usuario tenga alguno de ellos
  if (roles && roles.length > 0 && user) {
    const hasRequiredRole = roles.some(
      (role) => user.role === role || (user.isAdmin && role === 'admin'),
    )
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />
    }
  }

  return element
}
