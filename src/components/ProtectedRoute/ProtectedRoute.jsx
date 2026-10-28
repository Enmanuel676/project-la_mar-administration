import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider/hooks';

/**
 * Componente que protege rutas que requieren autenticación.
 * Si no hay sesión, redirige a /signin.
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
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading state mientras se verifica la autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Si hay roles especificados, verificar que el usuario tenga alguno de ellos
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((role) => user.role === role || (user.isAdmin && role === 'admin'));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return element;
}
