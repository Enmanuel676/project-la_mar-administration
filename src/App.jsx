import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import Dashboard from './components/Dashboard/Dashboard'
import { SESSION_EXPIRED_MESSAGE, api, setSessionExpiredHandler } from './lib/api'
import { clearSession, getToken, getUser, setSession, updateSessionUser } from './lib/session'

export default function App() {
  const [session, setSessionState] = useState(() => {
    const token = getToken()
    const user = getUser()
    // Si hay token pero el usuario no tiene email (sesión antigua), limpiar sesión
    if (token && (!user || !user.email)) {
      clearSession()
      return null
    }
    return token ? { token, user } : null
  })
  const navigate = useNavigate()
  const location = useLocation()
  // Aviso para la pantalla de login (p. ej. que la sesión caducó a mitad de una acción).
  const [loginNotice, setLoginNotice] = useState('')

  // Si el servidor rechaza el token en cualquier petición, se vuelve al login con el aviso,
  // en vez de seguir en el catálogo con todas las acciones fallando.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setSessionState(null)
      navigate('/login')
      setLoginNotice(SESSION_EXPIRED_MESSAGE)
    })
    return () => setSessionExpiredHandler(null)
  }, [navigate])

  // Verificar sesión al cambiar de ruta
  useEffect(() => {
    if (location.pathname !== '/login' && location.pathname !== '/register' && !session) {
      navigate('/login')
    }
  }, [location, session, navigate])

  // Sincronizar la sesión al cargar: si un admin cambió el rol del usuario,
  // se actualiza el estado local sin tener que cerrar sesión.
  useEffect(() => {
    if (!session) return
    api.getMe()
      .then((freshUser) => {
        const current = getUser()
        // Solo actualizar si hay cambios relevantes (rol o isAdmin)
        if (current && (
          current.role !== freshUser.role ||
          current.isAdmin !== freshUser.isAdmin ||
          current.name !== freshUser.name
        )) {
          updateSessionUser(freshUser)
          setSessionState((prev) => ({ ...prev, user: freshUser }))
        }
      })
      .catch(() => {
        // Si falla la sincronización, seguimos con la sesión actual
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Solo al montar el componente (session se lee solo al montar)
  }, [])

  function handleLogin(token, user) {
    setSession(token, user)
    setSessionState({ token, user })
    setLoginNotice('')
    navigate('/')
  }

  function handleLogout() {
    // Best-effort: le dice al servidor que borre la cookie de sesión. Si falla (p. ej. sin
    // conexión), se cierra sesión igualmente: la copia local se borra siempre.
    api.logout().catch(() => {})
    clearSession()
    setSessionState(null)
    setLoginNotice('')
    navigate('/login')
  }

  function handleRegisterSuccess(session) {
    // El backend devuelve { token, user } igual que el login: se inicia sesión directamente.
    setSession(session.token, session.user)
    setSessionState({ token: session.token, user: session.user })
    setLoginNotice('')
    navigate('/')
  }

  return (
    <div className="admin">
      <Routes>
        <Route path="/login" element={<Login notice={loginNotice} onLogin={handleLogin} onShowRegister={() => navigate('/register')} />} />
        <Route path="/register" element={<Register onRegister={handleRegisterSuccess} onBackToLogin={() => navigate('/login')} />} />
        <Route path="/*" element={session ? <Dashboard onLogout={handleLogout} currentUser={session.user} /> : <Login notice={loginNotice} onLogin={handleLogin} onShowRegister={() => navigate('/register')} />} />
      </Routes>
    </div>
  )
}
