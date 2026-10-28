import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import Dashboard from './components/Dashboard/Dashboard'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicRoute from './components/PublicRoute/PublicRoute'
import AdminRoute from './components/AdminRoute/AdminRoute'
import { useAuth } from './components/AuthProvider/hooks'
import { SESSION_EXPIRED_MESSAGE, api, setSessionExpiredHandler } from './lib/api'
import { clearSession, getToken, getUser, setSession, updateSessionUser } from './lib/session'

export default function App() {
  const { isAuthenticated, user, token, loading, login: authLogin, logout: authLogout, register: authRegister, syncUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Aviso para la pantalla de login (p. ej. que la sesión caducó a mitad de una acción).
  const [loginNotice, setLoginNotice] = useState('')
  
  // Para compatibilidad con el código existente que usa session.js directamente,
  // sincronizamos el contexto con localStorage
  const session = isAuthenticated && user ? { token, user } : null

  // Si el servidor rechaza el token en cualquier petición, se vuelve al login con el aviso,
  // en vez de seguir en el catálogo con todas las acciones fallando.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      // Limpia la sesión del contexto
      authLogout().catch(() => {})
      navigate('/signin')
      setLoginNotice(SESSION_EXPIRED_MESSAGE)
    })
    return () => setSessionExpiredHandler(null)
  }, [navigate, authLogout])

  // Verificar sesión al cambiar de ruta (bidireccional):
  // - Sin sesión: ir al login (salvo que ya estemos en login/registro).
  // - Con sesión: si estamos en login/registro, ir al dashboard.
  // Así, cuando otra pestaña inicia sesión (evento `storage` actualiza el contexto),
  // esta pestaña sale sola de la pantalla de login.
  // NOTA: La protección principal ahora la hacen los componentes ProtectedRoute y PublicRoute,
  // pero mantenemos esta lógica para la sincronización entre pestañas.
  useEffect(() => {
    if (!isAuthenticated && !loading && location.pathname !== '/signin' && location.pathname !== '/signup') {
      navigate('/signin')
    }
    if (isAuthenticated && !loading && (location.pathname === '/signin' || location.pathname === '/signup')) {
      navigate('/')
    }
  }, [location, isAuthenticated, loading, navigate])

  // Sincronizar la sesión al cargar: si un admin cambió el rol del usuario,
  // se actualiza el contexto sin tener que cerrar sesión.
  useEffect(() => {
    if (!isAuthenticated) return
    syncUser().catch(() => {
      // Si falla la sincronización, seguimos con la sesión actual
    })
  }, [isAuthenticated, syncUser])

  // Sincronización entre pestañas: cuando otra pestaña inicia o cierra sesión,
  // el AuthProvider ya maneja esto a través de su propio listener de storage.
  // No necesitamos duplicar la lógica aquí ya que useAuth() devuelve el estado sincronizado.

  function handleLogout() {
    // Cerrar sesión en el contexto
    authLogout().catch(() => {})
    setLoginNotice('')
    navigate('/signin')
  }

  // Las funciones handleLogin y handleRegisterSuccess ya no se usan directamente
  // porque Login y Register ahora navegan automáticamente usando el contexto.
  // Las mantenemos por compatibilidad en caso de que otros componentes las usen.

  return (
    <div className="admin">
      <Routes>
        <Route path="/signin" element={
          <PublicRoute element={<Login notice={loginNotice} onShowRegister={() => navigate('/signup')} />} />
        } />
        <Route path="/signup" element={
          <PublicRoute element={<Register onBackToLogin={() => navigate('/signin')} />} />
        } />
        <Route path="/*" element={
          <ProtectedRoute element={session ? <Dashboard onLogout={handleLogout} currentUser={session.user} /> : null} />
        } />
      </Routes>
    </div>
  )
}
