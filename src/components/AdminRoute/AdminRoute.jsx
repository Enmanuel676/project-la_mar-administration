import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider/hooks';

/**
 * Componente que protege rutas que requieren rol de administrador.
 * Si no hay sesión, redirige a /login.
 * Si hay sesión pero no es admin, redirige a / (dashboard).
 * 
 * Este componente es ahora un alias de ProtectedRoute con roles=['admin']
 * para mantener compatibilidad hacia atrás.
 * 
 * Uso: <Route path="/users" element={<AdminRoute element={<UsersView />} />} />
 * O preferiblemente: <Route path="/users" element={<ProtectedRoute roles={['admin']} element={<UsersView />} />} />
 */
export default function AdminRoute({ element }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading state mientras se verifica la autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar que el usuario sea administrador
  if (!user.isAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return element;
}
