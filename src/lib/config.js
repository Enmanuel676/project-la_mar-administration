export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')
).replace(/\/$/, '')
// Solo para el modo de demostración; el panel real consulta /api/config.
export const TRASH_DAYS = 30
export const SESSION_KEYS = {
  token: 'lamar_token',
  user: 'lamar_user',
}
