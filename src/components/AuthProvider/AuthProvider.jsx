import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getToken,
  getUser,
  setSession,
  clearSession,
  updateSessionUser,
} from '../../lib/session'
import { api } from '../../lib/api'
import { AuthContext } from './AuthContext'
import { SESSION_KEYS } from '../../lib/config'

function readSession() {
  const token = getToken()
  const user = getUser()
  return token && user?.email ? { token, user } : null
}

// App coordina las solicitudes; este proveedor mantiene la identidad y su persistencia.
export function AuthProvider({ children }) {
  const [session, setCurrentSession] = useState(readSession)
  const sessionRef = useRef(session)

  const updateSession = useCallback((next) => {
    sessionRef.current = next
    setCurrentSession(next)
  }, [])

  const clearAuth = useCallback(() => {
    clearSession()
    updateSession(null)
  }, [updateSession])

  const completeLogin = useCallback(
    (result) => {
      setSession(result.token, result.user)
      updateSession({ token: result.token, user: result.user })
    },
    [updateSession],
  )

  useEffect(() => {
    const onStorage = (event) => {
      if (
        event.key === null ||
        Object.values(SESSION_KEYS).includes(event.key)
      ) {
        updateSession(readSession())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [updateSession])

  const syncUser = useCallback(async () => {
    const activeToken = sessionRef.current?.token
    if (!activeToken) return null
    const user = await api.getMe()
    // Una respuesta anterior no puede restaurar una sesión cerrada o sustituida.
    if (sessionRef.current?.token === activeToken) {
      updateSessionUser(user)
      updateSession({ token: activeToken, user })
    }
    return user
  }, [updateSession])

  const logout = useCallback(async () => {
    const request = api.logout()
    clearAuth()
    // El estado local debe cerrarse incluso si el servidor está desconectado.
    await request.catch(() => {})
  }, [clearAuth])

  const user = session?.user ?? null
  return (
    <AuthContext.Provider
      value={{
        user,
        token: session?.token ?? null,
        isAuthenticated: !!session,
        isAdmin: !!(user?.isAdmin || user?.role === 'admin'),
        loading: false,
        completeLogin,
        clearAuth,
        logout,
        syncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
