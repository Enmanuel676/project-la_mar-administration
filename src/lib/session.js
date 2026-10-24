const TOKEN_KEY = 'lamar_token'
const USER_KEY = 'lamar_user'

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(token, user) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* almacenamiento no disponible */
  }
}

// Actualiza solo los datos del usuario en la sesión (sin cambiar el token).
// Útil cuando el backend devuelve información actualizada del usuario (p.ej. cambio de rol).
export function updateSessionUser(user) {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}
