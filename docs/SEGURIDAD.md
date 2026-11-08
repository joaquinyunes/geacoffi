# Seguridad de GeaCofi — informe (06/11/2026)

El panel `/admin.html` es lo único con login y con datos de clientes (pedidos con nombre y dirección). Este informe lista qué se revisó, qué se corrigió y qué queda a cargo de quien instala. Los números de verificación están en `docs/VERIFICACION.md`.

## Cómo entra la dueña
- Contraseña de **≥ 12 caracteres** guardada como **hash scrypt** (`ADMIN_PASSWORD_HASH`, se genera con `node tools/clave.mjs`). `ADMIN_PASSWORD` en claro solo sirve para desarrollo y se rechaza si tiene menos de 12.
- **2FA (TOTP, RFC 6238)** con `ADMIN_TOTP_SECRET`: app de autenticación en el celular. En producción de Vercel **es obligatorio**: sin el secreto el login responde 503 (se puede forzar a mano con `ADMIN_SIN_2FA=1`, no recomendado). Cada código vale una sola vez.
- Sesión en cookie **`HttpOnly; SameSite=Lax; Secure` (en https)**, 12 h de vida, guardada en Mongo (hash del token, no el token). Botón «Cerrar sesión en todos los dispositivos».
- Los pedidos que cambian datos exigen el encabezado `x-gc: 1` (frena CSRF aunque la cookie viaje sola).

## Paquete S: estado
| | Estado | Dónde / cómo |
|---|---|---|
| S1 audit | ✅ `npm audit --omit=dev` = 0 (ver VERIFICACION) | y el CI falla con altas (`ci.yml`) |
| S2 CSP | ✅ **bloquea** (`vercel.json`). Sin `unsafe-inline` en scripts ni `<style>`; solo `style-src-attr 'unsafe-inline'` porque las páginas usan `style="--len: 500"` y el 3D escribe estilos | probado en el navegador: portada, detalles, carta, armar y panel sin violaciones; un `fetch` a otro dominio sí se bloquea. No existe `/api/csp` de reportes en este proyecto: se miró en el navegador antes de pasar a bloqueo |
| S3 rate limit | ✅ login: 5 fallos / 15 min por IP + tope general de 30 / 15 min; pedidos 10 / 10 min; fotos 40 / h; guardar 60 / h. En Mongo (atómico, sirve con varias instancias) | `server/limite.ts`, tests en `login.test.ts` y `pedido.test.ts` |
| S4 | ✅ hash scrypt, ≥ 12, 2FA, cookie segura, cierre en todos los dispositivos | `server/sesion.ts`, `server/totp.ts` |
| S5 validación | ✅ sin librería externa: forma exacta del contenido y del pedido, rechazo de claves con `$` o `.` en cualquier nivel (NoSQL injection), límites de tamaño (JSON 1 MB, pedido 20 KB, foto 3 MB), fotos por **bytes reales** (JPG/PNG/WebP; SVG, HTML o .exe con extensión de imagen se rechazan), nombre de archivo nunca se usa (id aleatorio), 500 fotos como máximo | `server/foto.ts`, `server/pedido.ts` |
| S6 webhooks | — no aplica (no hay webhooks todavía; llegan con Mercado Pago) | |
| S7 | ✅ **registro de cambios**: cada guardado, subida de foto, cambio de estado de pedido, entrada y salida queda en `auditoria` con fecha, IP y qué campo pasó de qué a qué. Ninguna ruta lo borra ni lo edita; la dueña lo ve en el panel. 🟡 Roles: hay una sola cuenta (la dueña); roles múltiples se hacen cuando haya un segundo usuario | `server/auditoria.ts` |
| S8 secretos | ✅ ningún patrón de clave en **todo el historial de todas las ramas** (8 commits; mismas expresiones que el CI). `.env*` ignorado, `.env.example` sin valores | no se corrió gitleaks (no está instalado): se usaron las regex del CI sobre `git log --all -p` |
| S9 | ✅ CORS cerrado (solo `ORIGENES_PERMITIDOS`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, **HSTS**, `COOP`, `/.well-known/security.txt` (contacto = avisos privados de GitHub: hay que activarlos en el repo) | `vercel.json`, `public/.well-known/security.txt` |
| S10 backup | ✅ código + prueba de restauración (abajo). 🟡 el programa automático necesita secretos del repo | `tools/backup.mjs`, `tools/restaurar.mjs`, `.github/workflows/backup.yml` |
| S11 | ✅ Dependabot semanal agrupado; los PR de Dependabot **no disparan deploys** en Vercel (`git.deploymentEnabled`); `npm audit --audit-level=high` en el CI | `.github/dependabot.yml` |
| S12 datos personales | 🟡 los pedidos se **borran solos a los 90 días** (índice TTL) y no se guarda la IP del cliente. Falta política de privacidad y términos redactados con un profesional (Ley 25.326) | 👤 |
| S13 | ✅ este informe | |

## Hallazgos de la revisión y qué se hizo
1. **La contraseña viajaba en cada pedido** (`x-admin-clave`, guardada en `sessionStorage`) → reemplazada por sesión en cookie HttpOnly: un XSS ya no puede leerla.
2. **Sin límite de intentos** (solo una espera de 0,7 s) → bloqueo por IP y tope general.
3. **Mensajes con texto técnico** (`Error 500`, `JSON inválido`) → mensajes en castellano; ningún detalle interno sale (`ruta()` loguea en el servidor y responde genérico).
4. **Validación mínima** (solo claves y largo de listas) → forma completa de cada campo; precios, horas y fechas con rango.
5. **CSP solo en reporte** → bloqueando; el `<style>` del panel pasó a un archivo (`admin.css`).
6. **Foto: cualquier navegador podía mentir el tipo** → ya se decidía por bytes; ahora además la respuesta lleva `nosniff` y `CSP default-src 'none'; sandbox`, y se exige firma PNG completa.
7. **IP falsificable** detrás de proxies que agregan `X-Forwarded-For` (Render): en Vercel se usan `x-vercel-forwarded-for` / `x-real-ip` (no falsificables). En Render el límite por IP se puede esquivar; por eso existe el tope general del login.

## Riesgos que quedan (decisión de quien instala)
- **Un solo usuario de base de datos con permiso total**. Para que el registro de cambios sea de verdad inborrable desde la app, crear en Atlas un rol propio: `insert` + `find` sobre `auditoria`, y `readWrite` sobre el resto; y usar ese usuario en `MONGODB_URI`.
- **Atlas M0 (gratis) no hace backups**: por eso existe `tools/backup.mjs`. El workflow guarda el archivo (cifrado con `BACKUP_CLAVE`) como artefacto de GitHub 30 días. **El repo hoy es público**: los artefactos de repos públicos se pueden descargar con una cuenta de GitHub. El archivo está cifrado (AES-256-GCM), pero lo correcto es hacer el repo privado o correr el respaldo desde la computadora de quien mantiene.
- La caída del bloqueo global: alguien que falle 30 veces desde muchas IPs frena el login 15 min para todos (la dueña espera; no entra nadie sin contraseña y código). Es el costo de frenar ataques repartidos.
- Sin Sentry ni alertas de error: ver `docs/MONITOREO.md`.

## Prueba de restauración (S10)
- **6/11/2026, automática** (`tools/respaldo.test.mjs`, en cada `npm test`): se cargan contenido, una foto binaria y pedidos en una base; se hace el respaldo cifrado; se verifica que el archivo no contiene texto legible, que una clave equivocada se rechaza, que la restauración en otra base devuelve los documentos **iguales** (incluidos los bytes de la foto), que no se restauran las sesiones y que **no pisa** una base que ya tiene datos. Resultado: pasa.
- **6/11/2026, a mano con la CLI** sobre un Mongo local: `tools/backup.mjs` → archivo cifrado de 0,2 KB → `tools/restaurar.mjs` → `{ pedidos: 1, contenido: 1 }`; el segundo intento sobre la misma base se negó. Resultado: ok.
- **Pendiente 👤:** repetirlo sobre la base real de Atlas cuando exista (ver `docs/PENDIENTE-USUARIO.md`).
