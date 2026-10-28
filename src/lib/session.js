// localStorage (no sessionStorage): la sesión se comparte entre todas las pestañas
// del navegador. Si un usuario inicia sesión en una pestaña, las demás también
// tienen acceso sin tener que volver a iniciar sesión.
import { SESSION_KEYS } from './config'
const TOKEN_KEY = SESSION_KEYS.token
const USER_KEY = SESSION_KEYS.user

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* almacenamiento no disponible */
  }
}

// Actualiza solo los datos del usuario en la sesión (sin cambiar el token).
// Útil cuando el backend devuelve información actualizada del usuario (p.ej. cambio de rol).
export function updateSessionUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}
