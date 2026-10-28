import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import Dashboard from './components/Dashboard/Dashboard'
import PageLoader from './components/PageLoader/PageLoader'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import PublicRoute from './components/PublicRoute/PublicRoute'
import { AuthProvider } from './components/AuthProvider'
import { useAuth } from './components/AuthProvider/hooks'
import { CurrentUserContext } from './components/CurrentUserContext/CurrentUserContext'
import {
  SESSION_EXPIRED_MESSAGE,
  api,
  setSessionExpiredHandler,
} from './lib/api'

function AppContent() {
  const {
    isAuthenticated,
    user,
    token,
    completeLogin,
    clearAuth,
    logout,
    syncUser,
  } = useAuth()
  const navigate = useNavigate()
  const [loginNotice, setLoginNotice] = useState('')
  const [catalog, setCatalog] = useState(null)
  const [retentionDays, setRetentionDays] = useState(null)
  const accountKey = token ? `${token}:${user?.role}:${!!user?.isAdmin}` : null

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearAuth()
      setLoginNotice(SESSION_EXPIRED_MESSAGE)
      navigate('/', { replace: true })
    })
    return () => setSessionExpiredHandler(null)
  }, [navigate, clearAuth])

  useEffect(() => {
    if (!isAuthenticated) return
    syncUser().catch(() => {})
    const interval = setInterval(() => syncUser().catch(() => {}), 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, token, syncUser])

  useEffect(() => {
    if (!accountKey) return
    let ignore = false
    Promise.allSettled([api.list(), api.listDeleted()]).then(
      ([articles, deleted]) => {
        if (ignore) return
        const errors = [articles, deleted]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason.message)
        setCatalog({
          accountKey,
          articles: articles.status === 'fulfilled' ? articles.value : [],
          deleted: deleted.status === 'fulfilled' ? deleted.value : [],
          error: errors.join(' '),
        })
      },
    )
    api
      .getConfig()
      .then((config) => {
        if (
          !ignore &&
          Number.isInteger(config.trashRetentionDays) &&
          config.trashRetentionDays > 0
        ) {
          setRetentionDays(config.trashRetentionDays)
        }
      })
      .catch(() => {
        if (!ignore) setRetentionDays(null)
      })
    return () => {
      ignore = true
    }
  }, [accountKey])

  const handleLogin = useCallback(
    (email, password) => api.login(email.trim(), password),
    [],
  )
  const handleRegister = useCallback(
    (firstName, lastName, email, password) =>
      api.register(firstName, lastName, email.trim(), password),
    [],
  )
  const handleCreateUser = useCallback(
    (firstName, lastName, email, password) =>
      api.createUser(firstName, lastName, email.trim(), password),
    [],
  )
  const handleAuthenticated = useCallback(
    (result) => {
      setLoginNotice('')
      completeLogin(result)
      navigate('/', { replace: true })
    },
    [completeLogin, navigate],
  )
  const handleLogout = useCallback(() => {
    logout()
    setCatalog(null)
    setLoginNotice('')
    navigate('/', { replace: true })
  }, [logout, navigate])

  const loginPage = (
    <Login
      notice={loginNotice}
      onLogin={handleLogin}
      onLoginDone={handleAuthenticated}
      onShowRegister={() => navigate('/signup')}
    />
  )
  const registerPage = (
    <Register
      onRegister={handleRegister}
      onRegistered={handleAuthenticated}
      onBackToLogin={() => navigate('/')}
    />
  )
  const dashboard =
    isAuthenticated && catalog?.accountKey === accountKey ? (
      <Dashboard
        key={accountKey}
        onLogout={handleLogout}
        onRegister={handleCreateUser}
        initialCatalog={{ ...catalog, retentionDays }}
      />
    ) : isAuthenticated ? (
      <PageLoader isLoading={true} title="Cargando catálogo" />
    ) : null

  return (
    <CurrentUserContext.Provider value={user}>
      <div className="admin">
        <Routes>
          <Route path="/signin" element={<PublicRoute element={loginPage} />} />
          <Route path="/signup" element={<PublicRoute element={registerPage} />} />
          <Route path="/" element={isAuthenticated ? dashboard : loginPage} />
          <Route path="/*" element={<ProtectedRoute element={dashboard} />} />
        </Routes>
      </div>
    </CurrentUserContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
