import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/hooks';

/**
 * Componente que protege rutas públicas (como signin, signup).
 * Si el usuario YA está autenticado, lo redirige al dashboard (/).
 * Si no está autenticado, muestra el componente hijo (element).
 * 
 * Uso: <Route path="/signin" element={<PublicRoute element={<Login />} />} />
 */
export default function PublicRoute({ element }) {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar loading state mientras se verifica la autenticación
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si hay sesión válida, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return element;
}
