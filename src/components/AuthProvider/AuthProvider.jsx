/**
 * AuthProvider - Proveedor de contexto de autenticación
 * 
 * Este componente proporciona un contexto centralizado para gestionar el estado de autenticación.
 * Actualmente no está integrado en la aplicación, pero está disponible para uso futuro.
 * 
 * La aplicación actualmente usa session.js directamente en los componentes.
 * Para integrar este proveedor, envolver la aplicación con <AuthProvider> en App.jsx
 * y reemplazar las llamadas a session.js con useAuth() en los componentes.
 */

import { useEffect, useState, useCallback } from 'react';
import { getToken, getUser, setSession, clearSession, updateSessionUser } from '../../lib/session';
import { api } from '../../lib/api';
import { AuthContext } from './AuthContext';

/**
 * Proveedor de contexto de autenticación.
 * 
 * Inicializa el estado de autenticación desde localStorage y sincroniza con el backend.
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión inicial desde localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = getToken();
        const storedUser = getUser();

        // Si hay token pero el usuario no tiene email (sesión antigua), limpiar sesión
        if (storedToken && (!storedUser || !storedUser.email)) {
          clearSession();
          setLoading(false);
          return;
        }

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Error al cargar la sesión:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sincronizar usuario con el backend
  const syncUser = useCallback(async () => {
    if (!token) return null;

    try {
      const currentUser = await api.getMe();
      if (currentUser) {
        setUser(currentUser);
        updateSessionUser(currentUser);
        return currentUser;
      }
      return null;
    } catch (err) {
      // Si el token no es válido, limpiar la sesión
      if (err.message.includes('sesión') || err.message.includes('token')) {
        clearSession();
        setUser(null);
        setToken(null);
      }
      throw err;
    }
  }, [token]);

  // Verificar si el usuario está autenticado
  const checkAuth = useCallback(() => {
    return !!(token && user);
  }, [token, user]);

  // Verificar si el usuario es administrador
  const isAdminUser = useCallback(() => {
    return user && (user.isAdmin || user.role === 'admin');
  }, [user]);

  // Iniciar sesión
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.login(email, password);
      setToken(result.token);
      setUser(result.user);
      setSession(result.token, result.user);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Registrar usuario
  const register = useCallback(async (firstName, lastName, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.register(firstName, lastName, email, password);
      setToken(result.token);
      setUser(result.user);
      setSession(result.token, result.user);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await api.logout();
    } catch (err) {
      // Ignorar errores al cerrar sesión
      console.error('Error al cerrar sesión en el servidor:', err);
    } finally {
      clearSession();
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  }, []);

  // Proveedor los valores del contexto
  const value = {
    user,
    token,
    isAdmin: isAdminUser(),
    isAuthenticated: checkAuth(),
    loading,
    error,
    login,
    register,
    logout,
    syncUser,
    checkAuth,
    setUser,
    setToken,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
