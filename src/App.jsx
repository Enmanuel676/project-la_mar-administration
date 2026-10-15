import { useEffect, useState } from 'react'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'
import { SESSION_EXPIRED_MESSAGE, setSessionExpiredHandler } from './lib/api'
import { clearSession, getToken, getUser, setSession } from './lib/session'

export default function App() {
  const [session, setSessionState] = useState(() => {
    const token = getToken()
    return token ? { token, user: getUser() } : null
  })
  // Aviso para la pantalla de login (p. ej. que la sesión caducó a mitad de una acción).
  const [loginNotice, setLoginNotice] = useState('')

  // Si el servidor rechaza el token en cualquier petición, se vuelve al login con el aviso,
  // en vez de seguir en el catálogo con todas las acciones fallando.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setSessionState(null)
      setLoginNotice(SESSION_EXPIRED_MESSAGE)
    })
    return () => setSessionExpiredHandler(null)
  }, [])

  function handleLogin(token, user) {
    setSession(token, user)
    setSessionState({ token, user })
    setLoginNotice('')
  }

  function handleLogout() {
    clearSession()
    setSessionState(null)
    setLoginNotice('')
  }

  return (
    <div className="admin">
      {session ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login notice={loginNotice} onLogin={handleLogin} />
      )}
    </div>
  )
}
