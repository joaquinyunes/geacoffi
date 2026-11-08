# Despliegue de una instancia nueva para un cliente (V4)

Objetivo: de cero a una instancia verificada en **menos de 1 hora** (la parte del código tarda minutos; el resto son cuentas del cliente). Probado de cero en local el 06–08/11/2026: ver «Prueba de cero» al final.

## 0. Antes (cuentas a nombre del cliente) — 👤 con el cliente
1. **GitHub**: copiar el repo a una cuenta del cliente (o un repo privado nuevo).
2. **MongoDB Atlas**: proyecto + cluster. Para vender: **Flex** o superior si se quiere backup de Atlas; con **Free (M0) no hay backups** → usar el respaldo propio (paso 5). Usuario de base **solo sobre la base de este cliente** (idealmente con el rol que no puede borrar `auditoria`, ver `SEGURIDAD.md`). Network Access `0.0.0.0/0` (Vercel usa IPs dinámicas).
3. **Vercel**: plan **Pro** (Hobby es no comercial). Importar el repo.
4. **Dominio**: apuntar al proyecto de Vercel.

## 1. Datos del café (10 min)
Editar `negocio.js`: nombre, dirección, Instagram, chat, productos y precios. Lo que cambia seguido después se edita en el panel.

## 2. Acceso al panel (3 min)
```bash
node tools/clave.mjs
```
Pide una contraseña de ≥ 12 caracteres e imprime `ADMIN_PASSWORD_HASH` y `ADMIN_TOTP_SECRET`. El secreto se carga en la app de autenticación del celular del dueño («agregar manualmente»).

## 3. Variables en Vercel (5 min)
Settings → Environment Variables (Production): `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`. (Plantilla: `.env.example`. **No** poner `ADMIN_PASSWORD`.) Opcional: `ORIGENES_PERMITIDOS`.

## 4. Deploy y verificación (5 min)
Redeploy en Vercel y después:
```bash
node tools/verificar-instancia.mjs https://el-sitio-del-cliente.com
```
Tiene que decir «Todo en orden» (10 controles: portada, base, panel, 2FA, CSP en bloqueo, encabezados, `security.txt`, CORS, escritura sin sesión). Después, entrar al panel con contraseña + código y guardar un cambio de prueba.

## 5. Respaldo y monitoreo (10 min)
- Repo → Settings → Secrets → Actions: `MONGODB_URI`, `BACKUP_CLAVE` (clave larga que se guarda en el gestor de contraseñas del cliente). Variable `MONGODB_DB`. El workflow `Respaldo diario` corre solo; probarlo una vez con «Run workflow».
- Variable `SITIO_URL` para el workflow `Monitoreo` (`docs/MONITOREO.md`).
- **Probar la restauración** (obligatorio antes de entregar): `MONGODB_DB=prueba-restauracion BACKUP_CLAVE=... node tools/restaurar.mjs <archivo>` y anotar fecha y resultado en `docs/SEGURIDAD.md`.
- Si el repo es público, hacerlo **privado** antes de activar el respaldo por GitHub.

## 6. Entrega
Manual del dueño (`docs/manual/manual-dueno.pdf`, completar el contacto de soporte), capacitación de 1 hora, y checklist de traspaso: dominio, Vercel, Atlas, GitHub y la clave del respaldo **a nombre del cliente**.

## Probar sin nube (para desarrollo)
```bash
npm ci && npm run build
node tools/servir.mjs          # Mongo en memoria + dist/ con los mismos encabezados que Vercel, en http://localhost:4173
node tools/verificar-instancia.mjs http://localhost:4173
```

## Prueba de cero
Ver el resultado al final de `docs/VERIFICACION.md` (clon limpio → `npm ci` → build → servidor → verificador, con tiempos).
