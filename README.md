# Panel de administración · La Mar

**Web en producción:** <https://admin.lamarjoyeria.mooo.com>

Panel de administración de la joyería **La Mar**. Desde aquí se gestiona el catálogo que ve el
sitio público (`project-la_mar-frontend`): se crean, editan, publican y eliminan artículos, con
su foto, y los usuarios. Habla con la API de `project-la_mar-backend`.
(`project-la_mar-frontend`) y los usuarios. Habla con la API de `project-la_mar-backend`.

## Qué hace

- **Login y registro:** sesión por pestaña (`sessionStorage`) más cookie `HttpOnly` del
  servidor. El botón de registro solo ven los administradores; al registrarse se inicia
  sesión directamente.
- **Catálogo:** filtros (_Todos_, _Publicados_, _Borradores_, _Eliminados_) y buscador.
  Cada usuario ve solo sus publicaciones; un admin ve las de todos (con el nombre de quien
  las creó).
- **Artículos:** crear, editar y publicar con foto, precio, moneda, stock, categoría,
  colección, materiales y descripción.
- **Papelera:** al eliminar, el artículo se despublica y queda 30 días; se puede restaurar
  o borrar definitivamente.
- **Usuarios (solo admins):** listar, editar nombre, correo y rol, cambiar contraseña y
  eliminar. Al eliminar un usuario se borran también sus publicaciones.

## Roles y sesión

El panel no deduce el rol: usa `isAdmin` tal como llega del backend (login, registro o
`/users/me`). Al arrancar y cada 60 segundos consulta `/users/me`: si un admin cambió el
rol de la cuenta, actualiza la sesión y avisa para recargar.

## Stack

- React 19 + Vite
- CSS plano, sin librerías de UI
- ESLint (React Hooks, React Refresh)

## Estructura

```
src/
  main.jsx, App.jsx        entrada y decisión Login / Register / Dashboard
  lib/
    api.js                capa de datos (REST)
    session.js            token y usuario en sessionStorage
  components/
    Login/, Register/
    DoneButton/           botón con estado «Guardando…» → «Hecho»
    Dashboard/            catálogo, formularios, papelera, avisos, confirmaciones
    UsersView/            gestión de usuarios (solo admins)
```

## Puesta en marcha

Requisitos: Node.js 20.9+ y el backend encendido.

```bash
npm install
npm run dev
```

Vite indica la dirección local (normalmente `http://localhost:5173`). Necesitas una cuenta
creada en el backend (desde el propio panel o con `npm run seed:admin` en el backend).

## Scripts

- `npm run dev`: desarrollo con recarga en caliente.
- `npm run build`: build de producción en `dist/`.
- `npm run preview`: sirve el build localmente.
- `npm run lint`: ESLint.

## Conexión con el backend

Todo pasa por `src/lib/api.js`. `API_BASE_URL` apunta a la API (`http://localhost:3000/api`
en local; se define con `VITE_API_URL` al compilar). `USE_MOCK = false` (valor actual) usa
la API real.

Endpoints que usa:

| Método              | Ruta                         | Uso                               |
| ------------------- | ---------------------------- | --------------------------------- |
| POST                | `/signin`                    | Iniciar sesión                    |
| POST                | `/signup`                    | Crear cuenta                      |
| POST                | `/auth/logout`               | Cerrar sesión (borra la cookie)   |
| GET                 | `/users/me`                  | Refrescar el usuario de la sesión |
| GET/POST/PUT/DELETE | `/articles…`                 | Catálogo y papelera               |
| GET/PUT/DELETE      | `/users…`                    | Gestión de usuarios (solo admins) |
| POST                | `/users/:id/change-password` | Cambiar contraseña                |

Todas las peticiones van con `Authorization: Bearer <token>` y `credentials: 'include'`
(para la cookie de sesión). **Las rutas del panel son visibles en la barra del navegador**: `/signin`, `/signup` y `/` (Dashboard), para que puedas navegar directamente entre secciones y ver la URL completa en cualquier momento. Un `401` con sesión iniciada cierra la sesión y avisa.

## Fotos

Se elige el archivo (JPG, PNG, WebP o GIF, máx. 20 MB) y se sube al guardar como
`multipart/form-data`. El backend la optimiza (WebP, 1600 px). Si el archivo no es válido,
el panel intenta reducirlo en el navegador antes de enviarlo.

## Despliegue

1. Definir `VITE_API_URL` y ejecutar `npm run build`.
2. Servir `dist/` como sitio estático desde Nginx (`client_max_body_size 25m;`).
3. Añadir el dominio del panel a `ALLOWED_ORIGINS` en el backend.

## Auditoría y despliegue

Consultar [la auditoría de ambos repositorios](docs/AUDITORIA.md) y [la guía para Google Cloud](docs/DESPLIEGUE_GOOGLE_CLOUD.md).
