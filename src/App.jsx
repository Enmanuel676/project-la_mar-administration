import { useState } from 'react'
import Login from './components/Login/Login'
import Dashboard from './components/Dashboard/Dashboard'
import { clearSession, getToken, getUser, setSession } from './lib/session'

export default function App() {
  const [session, setSessionState] = useState(() => {
    const token = getToken()
    return token ? { token, user: getUser() } : null
  })

  function handleLogin(token, user) {
    setSession(token, user)
    setSessionState({ token, user })
  }

  function handleLogout() {
    clearSession()
    setSessionState(null)
  }

  return (
    <div className="admin">
      {session ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  )
}
