# Auditoría del panel y backend — 28 de octubre de 2026

Se revisaron ambos repositorios locales y sus contratos HTTP. No se desplegó el resultado. Las decisiones de diseño conservan login/registro como páginas y no añaden el encabezado de acceso que se retiró por petición del usuario.

## Correcciones

- La raíz `/` es pública. Cierre de sesión, caducidad y acceso anónimo a rutas privadas vuelven a `/`.
- App coordina las solicitudes de login, registro y carga de catálogo. AuthProvider mantiene identidad y persistencia; CurrentUserContext proporciona el usuario.
- Se mantiene la animación «Hecho» antes de abrir la sesión. El registro también termina su confirmación antes de cambiar de pantalla.
- Los endpoints canónicos son `/api/signin` y `/api/signup`; el backend conserva `/api/auth/signin` y `/api/auth/signup` para clientes anteriores.
- La creación administrativa usa `POST /api/users`, sin reemplazar el token ni la cookie del administrador.
- Se ignoran respuestas de sesiones anteriores y se evita que varios 401 simultáneos disparen varios cierres de sesión. El catálogo vuelve a cargar al cambiar la cuenta o sus permisos.
- Artículos, papelera y configuración se cargan sin que un fallo de `/api/config` vacíe las otras listas. Si no se conoce la retención, la interfaz no inventa un plazo de 30 días.
- Se corrigen CORS de `/api/config`, permisos basados en correos fijos, IDs de propietarios poblados, comparación de IDs en usuarios y sesiones de cuentas eliminadas. Un cambio de contraseña invalida los tokens anteriores.
- El registro público rechaza direcciones reservadas para administradores. El primer administrador se crea mediante el script de servidor.
- Se corrigen los scripts de conexión/creación del administrador, la reconexión a MongoDB, el arranque/apagado y el estado de salud. Se evita registrar la URI de MongoDB con sus credenciales.
- Los límites de login se aplican a los paths reales de Express y se configura el proxy de confianza para nginx local.
- El build usa rutas absolutas para assets, evitando fallos al recargar una ruta interna. En producción la API predeterminada es `/api`, no el localhost de la persona visitante.

## Verificación

- Panel: 38 pruebas automatizadas (rutas, localStorage, login y confirmación, catálogo sin configuración, edición/creación de usuarios, logout y respuestas antiguas).
- Backend: 38 pruebas unitarias y 11 pruebas de integración con HTTP y una instancia temporal real de MongoDB.
- La integración incluye CORS, autenticación, permisos, CRUD, conversión real de imágenes con sharp, papelera, retención, usuarios, cambio de contraseña, cuentas eliminadas, rate limiting, seed:admin y arranque/apagado en producción.
- El bucket de Cloud Storage se simula durante las pruebas para no crear ni borrar objetos reales.
- Compilación del panel, lint de ambos repositorios y comprobación de diferencias.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas reportadas en ambos repositorios en la fecha de la revisión.

Esto no equivale a garantizar ausencia de defectos ni validar el servidor publicado. Quedan verificaciones de infraestructura: dominio, certificados, nginx, acceso de la VM a MongoDB, permisos/lectura pública del bucket y los flujos en el navegador contra la API desplegada. Ver [la guía de despliegue](DESPLIEGUE_GOOGLE_CLOUD.md).
