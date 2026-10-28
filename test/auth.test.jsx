import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import {
  getToken,
  getUser,
  setSession,
  updateSessionUser,
  clearSession,
} from '../src/lib/session'
import { AuthContext } from '../src/components/AuthProvider/AuthContext'
import ProtectedRoute from '../src/components/ProtectedRoute/ProtectedRoute'
import AdminRoute from '../src/components/AdminRoute/AdminRoute'
import PublicRoute from '../src/components/PublicRoute/PublicRoute'

// Helper component for testing routes
const TestComponent = ({ name }) => <div>Test Component: {name}</div>

// Mock de useAuth para tests
const createMockAuth = (overrides = {}) => ({
  user: null,
  token: null,
  isAdmin: false,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  syncUser: vi.fn(),
  checkAuth: vi.fn(() => false),
  setUser: vi.fn(),
  setToken: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
})

// Componente wrapper para tests que inyecta el mock de useAuth
function MockAuthProvider({ children, authValue }) {
  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  )
}

// Helper to render with mock auth and router
function renderWithMockAuth(element, authValue, initialEntries = ['/test']) {
  return render(
    <MockAuthProvider authValue={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/test" element={element} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/"
            element={
              <div>
                {authValue.isAuthenticated ? 'Dashboard' : 'Login Page'}
              </div>
            }
          />
          <Route path="/users" element={<div>Users Page</div>} />
        </Routes>
      </MemoryRouter>
    </MockAuthProvider>,
  )
}

// Helper to render admin routes
function renderAdminWithMockAuth(
  element,
  authValue,
  initialEntries = ['/users'],
) {
  return render(
    <MockAuthProvider authValue={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/users" element={element} />
          <Route
            path="/"
            element={
              <div>
                {authValue.isAuthenticated ? 'Dashboard' : 'Login Page'}
              </div>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </MockAuthProvider>,
  )
}

// Helper to render public routes
function renderPublicWithMockAuth(
  element,
  authValue,
  initialEntries = ['/login'],
) {
  return render(
    <MockAuthProvider authValue={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={element} />
          <Route
            path="/"
            element={
              <div>
                {authValue.isAuthenticated ? 'Dashboard' : 'Login Page'}
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    </MockAuthProvider>,
  )
}

describe('Frontend Administration - Authentication Components', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('ProtectedRoute', () => {
    it('should render child element when authenticated', () => {
      const authValue = createMockAuth({
        user: { email: 'test@example.com', name: 'Test User' },
        token: 'test-token',
        isAuthenticated: true,
      })

      renderWithMockAuth(
        <ProtectedRoute element={<TestComponent name="Protected" />} />,
        authValue,
      )

      expect(screen.getByText('Test Component: Protected')).toBeInTheDocument()
    })

    it('should redirect to login when not authenticated', () => {
      const authValue = createMockAuth({
        user: null,
        token: null,
        isAuthenticated: false,
      })

      renderWithMockAuth(
        <ProtectedRoute element={<TestComponent name="Protected" />} />,
        authValue,
      )

      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('should show loading state while checking authentication', () => {
      const authValue = createMockAuth({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: true,
      })

      renderWithMockAuth(
        <ProtectedRoute element={<TestComponent name="Protected" />} />,
        authValue,
      )

      expect(
        screen.getByRole('status', { name: 'Cargando' }),
      ).toBeInTheDocument()
    })

    it('should render child when roles match', () => {
      const authValue = createMockAuth({
        user: { email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: true,
      })

      renderWithMockAuth(
        <ProtectedRoute
          roles={['admin']}
          element={<TestComponent name="Admin" />}
        />,
        authValue,
      )

      expect(screen.getByText('Test Component: Admin')).toBeInTheDocument()
    })

    it('should redirect to login when roles do not match', () => {
      const authValue = createMockAuth({
        user: { email: 'user@example.com', name: 'User', role: 'user' },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: false,
      })

      renderWithMockAuth(
        <ProtectedRoute
          roles={['admin']}
          element={<TestComponent name="Admin" />}
        />,
        authValue,
      )

      // Should redirect to root (/)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('AdminRoute', () => {
    it('should render child element for admin user', () => {
      const authValue = createMockAuth({
        user: {
          email: 'admin@example.com',
          name: 'Admin',
          isAdmin: true,
          role: 'admin',
        },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: true,
      })

      renderAdminWithMockAuth(
        <AdminRoute element={<TestComponent name="Admin" />} />,
        authValue,
      )

      expect(screen.getByText('Test Component: Admin')).toBeInTheDocument()
    })

    it('should redirect to login when no session exists', () => {
      const authValue = createMockAuth({
        user: null,
        token: null,
        isAuthenticated: false,
      })

      renderAdminWithMockAuth(
        <AdminRoute element={<TestComponent name="Admin" />} />,
        authValue,
      )

      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('should redirect to dashboard when user is not admin', () => {
      const authValue = createMockAuth({
        user: {
          email: 'user@example.com',
          name: 'User',
          isAdmin: false,
          role: 'user',
        },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: false,
      })

      renderAdminWithMockAuth(
        <AdminRoute element={<TestComponent name="Admin" />} />,
        authValue,
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should allow access when isAdmin is true but role is user', () => {
      const authValue = createMockAuth({
        user: {
          email: 'user@example.com',
          name: 'User',
          isAdmin: true,
          role: 'user',
        },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: true,
      })

      renderAdminWithMockAuth(
        <AdminRoute element={<TestComponent name="Admin" />} />,
        authValue,
      )

      expect(screen.getByText('Test Component: Admin')).toBeInTheDocument()
    })

    it('should allow access when role is admin but isAdmin is false', () => {
      const authValue = createMockAuth({
        user: {
          email: 'admin@example.com',
          name: 'Admin',
          isAdmin: false,
          role: 'admin',
        },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: true,
      })

      renderAdminWithMockAuth(
        <AdminRoute element={<TestComponent name="Admin" />} />,
        authValue,
      )

      // Note: AdminRoute checks user.isAdmin || user.role === 'admin'
      expect(screen.getByText('Test Component: Admin')).toBeInTheDocument()
    })

    it('should redirect to dashboard when user has neither isAdmin nor role admin', () => {
      const authValue = createMockAuth({
        user: {
          email: 'user@example.com',
          name: 'User',
          isAdmin: false,
          role: 'user',
        },
        token: 'test-token',
        isAuthenticated: true,
        isAdmin: false,
      })

      renderAdminWithMockAuth(
        <AdminRoute element={<TestComponent name="Admin" />} />,
        authValue,
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('PublicRoute', () => {
    it('should render child element when not authenticated', () => {
      const authValue = createMockAuth({
        user: null,
        token: null,
        isAuthenticated: false,
      })

      renderPublicWithMockAuth(
        <PublicRoute element={<TestComponent name="Public" />} />,
        authValue,
      )

      expect(screen.getByText('Test Component: Public')).toBeInTheDocument()
    })

    it('should redirect to dashboard when authenticated', () => {
      const authValue = createMockAuth({
        user: { email: 'test@example.com' },
        token: 'test-token',
        isAuthenticated: true,
      })

      renderPublicWithMockAuth(
        <PublicRoute element={<TestComponent name="Public" />} />,
        authValue,
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should show loading state while checking authentication', () => {
      const authValue = createMockAuth({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: true,
      })

      renderPublicWithMockAuth(
        <PublicRoute element={<TestComponent name="Public" />} />,
        authValue,
      )

      expect(
        screen.getByRole('status', { name: 'Cargando' }),
      ).toBeInTheDocument()
    })

    it('should show public component when only token exists', () => {
      const authValue = createMockAuth({
        user: null,
        token: 'test-token',
        isAuthenticated: false, // No authenticated because user is null
        loading: false,
      })

      renderPublicWithMockAuth(
        <PublicRoute element={<TestComponent name="Public" />} />,
        authValue,
      )

      expect(screen.getByText('Test Component: Public')).toBeInTheDocument()
    })

    it('should show public component when only user exists', () => {
      const authValue = createMockAuth({
        user: { email: 'test@example.com' },
        token: null,
        isAuthenticated: false, // No authenticated because token is null
        loading: false,
      })

      renderPublicWithMockAuth(
        <PublicRoute element={<TestComponent name="Public" />} />,
        authValue,
      )

      expect(screen.getByText('Test Component: Public')).toBeInTheDocument()
    })
  })
})

describe('Session Library', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('lamar_token', 'test-token')
      expect(getToken()).toBe('test-token')
    })

    it('should return null when no token in localStorage', () => {
      localStorage.removeItem('lamar_token')
      expect(getToken()).toBeNull()
    })

    it('should handle localStorage errors', () => {
      const originalGetItem = Storage.prototype.getItem
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage error')
      })

      expect(getToken()).toBeNull()

      Storage.prototype.getItem = originalGetItem
    })
  })

  describe('getUser', () => {
    it('should return parsed user from localStorage', () => {
      const user = { email: 'test@example.com', name: 'Test User' }
      localStorage.setItem('lamar_user', JSON.stringify(user))
      expect(getUser()).toEqual(user)
    })

    it('should return null when no user in localStorage', () => {
      localStorage.removeItem('lamar_user')
      expect(getUser()).toBeNull()
    })

    it('should return null when user data is invalid JSON', () => {
      localStorage.setItem('lamar_user', 'invalid-json')
      expect(getUser()).toBeNull()
    })

    it('should handle localStorage errors', () => {
      const originalGetItem = Storage.prototype.getItem
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage error')
      })

      expect(getUser()).toBeNull()

      Storage.prototype.getItem = originalGetItem
    })
  })

  describe('setSession', () => {
    it('should set token and user in localStorage', () => {
      const token = 'test-token'
      const user = { email: 'test@example.com', name: 'Test User' }

      setSession(token, user)

      expect(localStorage.getItem('lamar_token')).toBe(token)
      expect(localStorage.getItem('lamar_user')).toBe(JSON.stringify(user))
    })

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage error')
      })

      // Should not throw
      expect(() => setSession('token', {})).not.toThrow()

      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('updateSessionUser', () => {
    it('should update user in localStorage without changing token', () => {
      localStorage.setItem('lamar_token', 'old-token')
      const oldUser = { email: 'old@example.com' }
      const newUser = { email: 'new@example.com', name: 'New User' }
      localStorage.setItem('lamar_user', JSON.stringify(oldUser))

      updateSessionUser(newUser)

      expect(localStorage.getItem('lamar_token')).toBe('old-token')
      expect(localStorage.getItem('lamar_user')).toBe(JSON.stringify(newUser))
    })

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage error')
      })

      expect(() => updateSessionUser({})).not.toThrow()

      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('clearSession', () => {
    it('should remove token and user from localStorage', () => {
      localStorage.setItem('lamar_token', 'test-token')
      localStorage.setItem(
        'lamar_user',
        JSON.stringify({ email: 'test@example.com' }),
      )

      clearSession()

      expect(localStorage.getItem('lamar_token')).toBeNull()
      expect(localStorage.getItem('lamar_user')).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      const originalRemoveItem = Storage.prototype.removeItem
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('localStorage error')
      })

      expect(() => clearSession()).not.toThrow()

      Storage.prototype.removeItem = originalRemoveItem
    })
  })
})
