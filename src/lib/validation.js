/* ==================================================================
 * VALIDACIÓN EN EL NAVEGADOR
 * ------------------------------------------------------------------
 * Las mismas reglas que el backend (src/middlewares/validation.js y los
 * modelos): así ningún formulario envía datos que el servidor rechazaría.
 * Cada función devuelve { campo: 'mensaje' } solo con los campos que fallan;
 * un objeto vacío significa que el formulario es válido.
 * ================================================================== */

export const LIMITS = {
  name: 80,
  collection: 80,
  materials: 200,
  description: 600,
  password: 128,
}

// Basta con la forma usuario@dominio.ext: el backend hace la comprobación completa.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

export function validateLogin({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Escribe tu correo electrónico.'
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = 'El correo electrónico no es válido.'
  if (!password) errors.password = 'Escribe tu contraseña.'
  else if (password.length > LIMITS.password)
    errors.password = `La contraseña no puede superar los ${LIMITS.password} caracteres.`
  return errors
}

function checkMaxLength(errors, form, field, label) {
  if (form[field].trim().length > LIMITS[field]) {
    errors[field] = `${label} no puede superar los ${LIMITS[field]} caracteres.`
  }
}

// `form` guarda los valores tal como están en los campos: los números llegan como texto.
export function validateArticle(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
  else checkMaxLength(errors, form, 'name', 'El nombre')

  const price = String(form.price).trim()
  if (!price) errors.price = 'El precio es obligatorio.'
  else if (!Number.isFinite(Number(price)))
    errors.price = 'El precio debe ser un número.'
  else if (Number(price) < 0) errors.price = 'El precio no puede ser negativo.'

  // Vacío es válido: significa «sin límite de stock».
  const stock = String(form.stock).trim()
  if (stock) {
    if (!Number.isInteger(Number(stock)))
      errors.stock = 'El stock debe ser un número entero.'
    else if (Number(stock) < 0) errors.stock = 'El stock no puede ser negativo.'
  }

  checkMaxLength(errors, form, 'collection', 'La colección')
  checkMaxLength(errors, form, 'materials', 'Los materiales')
  checkMaxLength(errors, form, 'description', 'La descripción')

  return errors
}
