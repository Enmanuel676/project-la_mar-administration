# Frontend · Administración La Mar

Panel de administración de la joyería **La Mar**. Desde aquí se gestiona el catálogo que ve el
sitio público (`project-la_mar-frontend`): se crean, editan, publican y eliminan artículos, con
su foto. Habla con la API de `project-la_mar-backend`.

## Qué puede hacer

- **Iniciar sesión** con correo y contraseña. La sesión dura mientras la pestaña esté abierta
  (se guarda en `sessionStorage`) y se cierra sola si el token caduca.
- **Ver el catálogo** con contadores y filtros: _Todos_, _Publicados_, _Borradores_ y
  _Eliminados_, además de un buscador por texto.
- **Crear y editar artículos**: nombre, precio, moneda (USD o CUP), stock, categoría
  (Anillos, Collares, Pendientes, Pulseras, Relojes), colección, materiales, descripción, foto y
  estado de publicación. Nombre y precio son obligatorios.
- **Publicar o pasar a borrador** un artículo con un solo clic desde su tarjeta.
- **Papelera**: eliminar un artículo lo despublica y lo manda a _Eliminados_, donde se conserva
  30 días. Desde ahí se puede **restaurar** (vuelve como borrador) o **borrar definitivamente**.
  Cada tarjeta muestra los días que le quedan.
- **Avisos y confirmaciones**: mensajes breves tras cada acción y un diálogo de confirmación
  antes de eliminar.
- **Botones con estado**: mientras responde el servidor muestran «Cargando…», «Eliminando…»,
  «Borrando…» o «Restaurando…», y al terminar pasan a «Hecho» (la etiqueta Publicado/Borrador,
  al estado nuevo) con la misma disolución en píxeles que las tarjetas del sitio público.

## Stack

- React 19 con Vite
- CSS plano (`src/index.css` y `src/administracion.css`), sin librerías de UI
- ESLint (con los plugins de React Hooks y React Refresh)
- Tipografías Montserrat y Playfair Display, e iconos Material Symbols (Google Fonts)

## Estructura

```
src/
  main.jsx                      punto de entrada
  App.jsx                       decide entre Login y Dashboard según la sesión
  lib/
    api.js                      capa de datos: llamadas REST (y un mock con localStorage)
    session.js                  token y usuario en sessionStorage
    pixelDissolve.js            disolución en píxeles, copiada de la del frontend
  components/
    DoneButton/DoneButton.jsx   botón que pasa de su estado de carga a «Hecho» con esa disolución
    Login/Login.jsx             pantalla de acceso
    Dashboard/
      Dashboard.jsx             estado general: artículos, papelera, avisos y confirmaciones
      CatalogView.jsx           listado, filtros y buscador
      ArticleCard.jsx           tarjeta de un artículo
      TrashCard.jsx             tarjeta de la papelera (con cuenta atrás)
      ArticleFormView.jsx       formulario de crear / editar, con la foto
      ConfirmDialog.jsx         confirmación de eliminar
      Toasts.jsx                avisos temporales
      Money.jsx                 formato del precio con su moneda
public/                         logo
dist/                           build de producción (lo genera `npm run build`)
```

## Puesta en marcha

Requisitos: Node.js 20.9+ y el backend encendido (ver `project-la_mar-backend/README.md`).

```bash
npm install
npm run dev
```

Vite indica la dirección local (normalmente `http://localhost:5173`). Para entrar necesitas un
administrador creado en el backend con `npm run seed:admin`.

## Scripts

- `npm run dev`: servidor de desarrollo con recarga en caliente.
- `npm run build`: genera la versión de producción en `dist/`.
- `npm run preview`: sirve localmente el build de producción.
- `npm run lint`: revisa el código con ESLint.

## Conexión con el backend

Toda la comunicación pasa por `src/lib/api.js`. Dos constantes arriba del archivo controlan
cómo funciona:

- `API_BASE_URL`: dirección de la API. Ahora es `http://localhost:3000/api`; **hay que
  cambiarla por el dominio real antes de hacer el build de producción**.
- `USE_MOCK`: con `true` el panel funciona sin backend, guardando datos de ejemplo en el
  `localStorage` del navegador (acceso de prueba `admin@lamar.com` / `lamar2026`). Con `false`
  (valor actual) usa la API real.

Endpoints que usa el panel (el contrato completo está en el README del backend):

| Método | Ruta                      | Uso                               |
| ------ | ------------------------- | --------------------------------- |
| POST   | `/auth/login`             | Iniciar sesión                    |
| GET    | `/articles`               | Listar artículos activos          |
| POST   | `/articles`               | Crear                             |
| PUT    | `/articles/:id`           | Editar o cambiar solo `published` |
| DELETE | `/articles/:id`           | Mandar a la papelera              |
| GET    | `/articles/deleted`       | Listar la papelera                |
| POST   | `/articles/:id/restore`   | Restaurar                         |
| DELETE | `/articles/:id/permanent` | Borrado definitivo                |

Todas las peticiones llevan `Authorization: Bearer <token>`. Un `401` con sesión iniciada
cierra la sesión y avisa de que caducó; un `413` indica que la foto pesa demasiado para el
servidor.

## Fotos

- Se elige un archivo (JPG, PNG, WebP o GIF, hasta 20 MB) y se ve una vista previa. La foto
  **se sube al guardar**, como `multipart/form-data` en el campo `image`.
- El panel envía la foto original: es el backend quien la convierte a WebP, la endereza, la
  reduce a 1600 px y la comprime.
- Si el archivo no es válido para el backend (un formato como HEIC, o más de 20 MB), el panel
  intenta reducirlo en el navegador antes de enviarlo.
- Para quitar la foto de un artículo, el botón de la papelera junto a la imagen.
- Los límites (`IMAGE_TYPES`, `MAX_IMAGE_MB`, `MAX_IMAGE_SIDE`) están en `api.js` y deben
  coincidir con los del backend.

## Despliegue

Pensado para una VM de Google Cloud con Nginx como proxy inverso:

1. Ajustar `API_BASE_URL` y ejecutar `npm run build`.
2. Servir el contenido de `dist/` como sitio estático desde Nginx.
3. Añadir el dominio del panel a `ALLOWED_ORIGINS` en el `.env` del backend; si no, el
   navegador bloqueará las peticiones por CORS.
4. En Nginx, `client_max_body_size 25m;`, para que no corte las fotos grandes.

El panel lleva `noindex, nofollow` para que los buscadores no lo indexen.
