/* ==================================================================
 * CAPA DE DATOS
 * ------------------------------------------------------------------
 * Todo el acceso a datos pasa por `api`. Mientras USE_MOCK sea true,
 * los datos se guardan en localStorage del navegador. Para conectar el
 * backend, pon USE_MOCK = false y ajusta API_BASE_URL: las funciones
 * ya hacen las llamadas REST esperadas.
 *
 *   POST   /auth/signin         { email, password } → { token, user }
 *   GET    /articles                                → Article[]
 *   POST   /articles            Article             → Article
 *   PUT    /articles/:id        Article             → Article
 *   DELETE /articles/:id                            → 204  (borrado lógico: pasa a eliminados)
 *   GET    /articles/deleted                        → Article[] (con deletedAt, últimos 30 días)
 *   POST   /articles/:id/restore                    → Article
 *   DELETE /articles/:id/permanent                  → 204
 *
 * El backend debe purgar a diario los artículos con deletedAt > 30 días
 * (p. ej. un cron job o un índice TTL si usas MongoDB).
 *
 * Article = { id, name, price, currency ('USD' | 'CUP'), stock, category, collection, materials,
 *             description, image, published, updatedAt, deletedAt? }
 * ================================================================== */
import { getToken, getUser, clearSession } from './session'

const USE_MOCK = false
// En el servidor se compila con VITE_API_URL (p. ej. https://api.lamarjoyeria.mooo.com/api).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const TRASH_DAYS = 30
export const DAY_MS = 24 * 60 * 60 * 1000
export const CURRENCIES = { USD: 'Dólar estadounidense', CUP: 'Peso cubano' }

// Fotos. Deben coincidir con el backend: formatos y peso con ACCEPTED_TYPES y MAX_MB de
// src/middlewares/upload.js, y el lado con MAX_SIDE de src/utils/optimizeImage.js.
export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]
export const MAX_IMAGE_MB = 20
export const MAX_IMAGE_SIDE = 1600

export const SESSION_EXPIRED_MESSAGE =
  'Tu sesión ha caducado. Vuelve a iniciar sesión.'

// Quién reacciona cuando caduca la sesión (App: vuelve al login). Se avisa desde aquí, el
// único sitio que ve todas las respuestas, para que dé igual qué acción se estaba haciendo.
let onSessionExpired = null
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

// El backend responde los errores como { message }. Se muestra solo ese texto, no el JSON crudo.
async function errorMessage(res) {
  try {
    const data = await res.json()
    if (data && data.message) return data.message
  } catch {
    /* la respuesta no era JSON */
  }
  return 'Error ' + res.status
}

// fetch no informa de cuánto se ha subido, así que la foto se envía con XMLHttpRequest para
// poder mostrar el progreso. Devuelve un Response normal: el resto de `http` no cambia.
function upload(method, url, headers, form, onProgress) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    // withCredentials: que la petición cross-origin acepte y mande cookies (la de sesión).
    xhr.withCredentials = true
    Object.entries(headers).forEach(function ([key, value]) {
      xhr.setRequestHeader(key, value)
    })
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.upload.onload = function () {
      onProgress(100)
    }
    xhr.onload = function () {
      resolve(
        new Response(xhr.status === 204 ? null : xhr.responseText, {
          status: xhr.status,
        }),
      )
    }
    xhr.onerror = reject
    xhr.send(form)
  })
}

async function http(method, path, body, onProgress) {
  const token = getToken()
  // Con FormData (artículo con foto) no se pone Content-Type: el navegador lo añade solo,
  // con el "boundary" que separa los campos. Si se fijara a mano, el backend no podría leerlo.
  const isForm = body instanceof FormData
  const headers = Object.assign(
    {},
    isForm || !body ? {} : { 'Content-Type': 'application/json' },
    token ? { Authorization: 'Bearer ' + token } : {},
  )
  let res
  try {
    res =
      isForm && onProgress
        ? await upload(method, API_BASE_URL + path, headers, body, onProgress)
        : await fetch(API_BASE_URL + path, {
            method,
            headers,
            body: isForm ? body : body ? JSON.stringify(body) : undefined,
            // Sin esto el navegador descarta la cookie de sesión (Set-Cookie) que manda el
            // login: la petición al backend es cross-origin (panel en otro puerto/dominio).
            credentials: 'include',
          })
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor. Comprueba que el backend está encendido.',
    )
  }
  // Un 401 con token guardado es una sesión caducada. Sin token (el login) es una
  // contraseña incorrecta, y ahí se muestra el mensaje del backend.
  if (res.status === 401 && token) {
    clearSession()
    if (onSessionExpired) onSessionExpired()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }
  // nginx corta lo que pasa de su client_max_body_size antes de que llegue al backend, y
  // responde con una página HTML: sin esto el panel solo mostraría "Error 413".
  if (res.status === 413)
    throw new Error('La imagen pesa demasiado para el servidor.')
  if (!res.ok) throw new Error(await errorMessage(res))
  return res.status === 204 ? null : res.json()
}

// Prepara un artículo para enviarlo al backend. `image` es solo la vista previa del panel y
// el backend la rechaza: la foto viaja como archivo (`imageFile`) dentro de un FormData.
// Sin foto nueva se envía JSON normal, que también sirve para cambios sueltos ({ published }).
function toBody(data) {
  const { image, imageFile, ...fields } = data // eslint-disable-line no-unused-vars
  if (!imageFile) return fields
  const form = new FormData()
  Object.entries(fields).forEach(function ([key, value]) {
    form.append(key, value === null ? '' : value)
  })
  form.append('image', imageFile)
  return form
}

const mock = (function () {
  const KEY = 'lamar_admin_articles'
  const delay = function (v) {
    return new Promise(function (r) {
      setTimeout(function () {
        r(v)
      }, 250)
    })
  }
  const seed = [
    {
      id: 'a1',
      name: "L'Abysse Vert",
      price: 48000,
      currency: 'USD',
      stock: 1,
      category: 'Anillos',
      collection: 'Collection Océano',
      materials: 'Émeraude Colombie 4.22 ct · Or rose 18k',
      description:
        'Bague solitaire émeraude & or rose satiné. Pièce unique nº 01.',
      image: '',
      published: true,
    },
    {
      id: 'a2',
      name: 'Perle des Abysses',
      price: 12500,
      currency: 'USD',
      stock: 3,
      category: 'Collares',
      collection: 'Collection Océano',
      materials: 'Perle de Tahiti · Or blanc 18k',
      description: 'Collier ras-de-cou à perle noire unique.',
      image: '',
      published: true,
    },
    {
      id: 'a3',
      name: 'Écume Rose',
      price: 1650000,
      currency: 'CUP',
      stock: 5,
      category: 'Pendientes',
      collection: 'Atelier Vendôme',
      materials: 'Morganite · Diamants F-VVS',
      description: 'Pendants d’oreilles en goutte, serti descendant.',
      image: '',
      published: false,
    },
    {
      id: 'a4',
      name: 'Bracelet Corail',
      price: 4200,
      currency: 'USD',
      stock: 0,
      category: 'Pulseras',
      collection: 'Collection Océano',
      materials: 'Corail rouge · Or jaune 18k',
      description: 'Jonc fin, fin de série.',
      image: '',
      published: false,
      deletedAt: Date.now() - 26 * DAY_MS,
    },
  ]
  function load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* almacenamiento no disponible */
    }
    return seed.map(function (a) {
      return Object.assign({ updatedAt: Date.now() }, a)
    })
  }
  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list))
    } catch {
      /* almacenamiento no disponible */
    }
  }
  // imageFile y removeImage solo le sirven al backend real; el mock guarda `image` (la vista previa).
  function withoutUpload(data) {
    const { imageFile, removeImage, ...rest } = data
    if (removeImage) rest.image = ''
    // Sin bucket, la foto se enlaza con una URL temporal propia (la del formulario se libera al
    // cerrarlo): se ve durante la sesión, pero no después de recargar la página.
    if (imageFile) rest.image = URL.createObjectURL(imageFile)
    return rest
  }
  let items = load()
  // Simula la purga automática del backend.
  function purge() {
    const limit = Date.now() - TRASH_DAYS * DAY_MS
    const before = items.length
    items = items.filter(function (a) {
      return !a.deletedAt || a.deletedAt > limit
    })
    if (items.length !== before) save(items)
  }
  function find(id) {
    return items.find(function (a) {
      return a.id === id
    })
  }
  return {
    login: function (email, password) {
      if (
        email.trim().toLowerCase() === 'admin@lamar.com' &&
        password === 'lamar2026'
      ) {
        return delay({
          token: 'mock-' + Date.now(),
          user: { email: email, name: 'Admin' },
        })
      }
      return delay(null).then(function () {
        throw new Error('Correo o contraseña incorrectos.')
      })
    },
    register: function (firstName, lastName, email) {
      // Mock: simula un registro exitoso
      return delay({
        token: 'mock-' + Date.now(),
        user: {
          email: email,
          name: firstName + ' ' + lastName,
          role: 'user',
          isAdmin: false,
        },
      })
    },
    // Mock: obtener usuario actual (simula GET /users/me)
    getMe: function () {
      const user = getUser()
      return delay(user || null)
    },
    // Mock: cerrar sesión en el servidor (borra la cookie; aquí solo se resuelve)
    logout: function () {
      return delay(null)
    },
    // Gestión de usuarios (mock)
    listUsers: function () {
      return delay([
        {
          id: 'u1',
          email: 'darelisbatistag@gmail.com',
          name: 'Dara Libatista',
          role: 'admin',
          isAdmin: true,
          createdAt: Date.now(),
        },
        {
          id: 'u2',
          email: 'enmanuel676hd@gmail.com',
          name: 'Enmanuel HD',
          role: 'admin',
          isAdmin: true,
          createdAt: Date.now(),
        },
        {
          id: 'u3',
          email: 'usuario@ejemplo.com',
          name: 'Usuario Ejemplo',
          role: 'user',
          isAdmin: false,
          createdAt: Date.now(),
        },
      ])
    },
    getUser: function (id) {
      return delay({
        id: id,
        email: 'usuario@ejemplo.com',
        name: 'Usuario Ejemplo',
        role: 'user',
        isAdmin: false,
        createdAt: Date.now(),
      })
    },
    updateUser: function (id, data) {
      // Actualizar el rol y recalcular isAdmin
      const updated = { id: id, ...data }
      if (data.role) {
        updated.isAdmin =
          data.role === 'admin' ||
          ['darelisbatistag@gmail.com', 'enmanuel676hd@gmail.com'].includes(
            data.email?.toLowerCase()?.trim(),
          )
      }
      return delay(updated)
    },
    deleteUser: function () {
      return delay(null)
    },
    changeUserPassword: function () {
      return delay(null)
    },
    list: function () {
      purge()
      const activeItems = items.filter(function (a) {
        return !a.deletedAt
      })
      // Añadir información del owner para simular el populate
      return delay(
        activeItems.map(function (a) {
          return { ...a, ownerName: 'Admin', ownerEmail: 'admin@lamar.com' }
        }),
      )
    },
    listDeleted: function () {
      purge()
      const deletedItems = items
        .filter(function (a) {
          return a.deletedAt
        })
        .sort(function (a, b) {
          return b.deletedAt - a.deletedAt
        })
      // Añadir información del owner para simular el populate
      return delay(
        deletedItems.map(function (a) {
          return { ...a, ownerName: 'Admin', ownerEmail: 'admin@lamar.com' }
        }),
      )
    },
    create: function (data) {
      const a = Object.assign({}, withoutUpload(data), {
        id: 'a' + Date.now().toString(36),
        updatedAt: Date.now(),
      })
      items.unshift(a)
      save(items)
      return delay(a)
    },
    update: function (id, data) {
      const i = items.findIndex(function (a) {
        return a.id === id
      })
      if (i < 0) return Promise.reject(new Error('Artículo no encontrado.'))
      items[i] = Object.assign({}, items[i], withoutUpload(data), {
        id: id,
        updatedAt: Date.now(),
      })
      save(items)
      return delay(items[i])
    },
    remove: function (id) {
      const a = find(id)
      if (a) {
        a.deletedAt = Date.now()
        a.published = false
        save(items)
      }
      return delay(null)
    },
    restore: function (id) {
      const a = find(id)
      if (!a) return Promise.reject(new Error('Artículo no encontrado.'))
      delete a.deletedAt
      a.updatedAt = Date.now()
      save(items)
      return delay(Object.assign({}, a))
    },
    destroy: function (id) {
      items = items.filter(function (a) {
        return a.id !== id
      })
      save(items)
      return delay(null)
    },
  }
})()

export const api = USE_MOCK
  ? mock
  : {
      login: function (email, password) {
        return http('POST', '/auth/signin', { email: email, password: password })
      },
      register: function (firstName, lastName, email, password) {
        return http('POST', '/auth/signup', {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
        })
      },
      // Datos del usuario autenticado (para sincronizar la sesión si cambió el rol)
      getMe: function () {
        return http('GET', '/users/me')
      },
      // Cierre de sesión en el servidor: borra la cookie de sesión del navegador
      logout: function () {
        return http('POST', '/auth/logout')
      },
      // Gestión de usuarios (solo admin)
      listUsers: function () {
        return http('GET', '/users')
      },
      getUser: function (id) {
        return http('GET', '/users/' + encodeURIComponent(id))
      },
      updateUser: function (id, data) {
        return http('PUT', '/users/' + encodeURIComponent(id), data)
      },
      deleteUser: function (id) {
        return http('DELETE', '/users/' + encodeURIComponent(id))
      },
      changeUserPassword: function (id, password) {
        return http(
          'POST',
          '/users/' + encodeURIComponent(id) + '/change-password',
          { password: password },
        )
      },
      list: function () {
        return http('GET', '/articles')
      },
      // `onProgress(porcentaje)` es opcional y solo se llama si se sube una foto.
      create: function (data, onProgress) {
        return http('POST', '/articles', toBody(data), onProgress)
      },
      update: function (id, data, onProgress) {
        return http(
          'PUT',
          '/articles/' + encodeURIComponent(id),
          toBody(data),
          onProgress,
        )
      },
      remove: function (id) {
        return http('DELETE', '/articles/' + encodeURIComponent(id))
      },
      listDeleted: function () {
        return http('GET', '/articles/deleted')
      },
      restore: function (id) {
        return http('POST', '/articles/' + encodeURIComponent(id) + '/restore')
      },
      destroy: function (id) {
        return http(
          'DELETE',
          '/articles/' + encodeURIComponent(id) + '/permanent',
        )
      },
    }
