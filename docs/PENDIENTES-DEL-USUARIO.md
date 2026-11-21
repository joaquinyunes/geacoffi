# Lo que te toca a vos (GeaCofi) — actualizado el 19/11/2026

Todo lo que se puede hacer sin tus cuentas está hecho y verificado (69 tests, tsc, build y `npm audit` en verde: números en `docs/VERIFICACION.md`). Lo que sigue necesita tus cuentas, tus decisiones o a un tercero. Está en orden: lo primero destraba casi todo lo demás.

## 1. Publicar con base real (G7) — 30 minutos
1. **Atlas:** crear el cluster y un usuario solo para la base de GeaCofi; Network Access `0.0.0.0/0`. Opcional pero recomendado: rol con `insert`/`find` sobre `auditoria` y `readWrite` sobre el resto (`docs/SEGURIDAD.md`).
2. **Contraseña y 2FA:** en tu computadora `node tools/clave.mjs` (pide una contraseña de ≥ 12 caracteres). Copiá `ADMIN_PASSWORD_HASH` y `ADMIN_TOTP_SECRET` a Vercel y cargá el secreto en la app de autenticación del celular.
3. **Vercel** (proyecto `geacoffi`; el `geacofi` es el duplicado de G8): variables de Production: `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`. Redeploy. **Ojo:** el plan Hobby es «personal, no comercial»; para cobrar a un cliente hace falta Pro.
4. **Verificar:** `node tools/verificar-instancia.mjs https://<tu-url>` → «Todo en orden». Después, entrar al panel y guardar un cambio.
5. **Medir (G6):** `node tools/medir-peso.mjs https://<tu-url> 15` (criterio: portada < 1 MB; en el build local dio 0,89 MiB y LCP 1,05 s en Slow 4G simulada).
6. Cargar el **número de WhatsApp** que recibe los pedidos en el panel (hoy está vacío: el cliente abre el chat y pega el pedido).

## 2. Avisos y respaldo (10 minutos cada uno)
- **Avisos al celular (V7), sin cuenta:** instalá la app **ntfy**, suscribite a un tema largo y secreto (ej. `geacofi-x7k2…`). Cargá en Vercel `ALERTA_URL=https://ntfy.sh/<tu-tema>` (avisa errores del servidor, máx. 1 cada 10 min por ruta, sin datos de clientes) y como secreto del repo `ALERTA_URL` (lo usa el monitoreo cuando se cae el sitio). Variable del repo `SITIO_URL` para el workflow `Monitoreo`.
- **UptimeRobot** (más confiable que el workflow de GitHub) apuntando a `/api/salud`. **Sentry** si querés ver el detalle de los errores (no hace falta para operar).
- **Respaldo (S10):** secretos del repo `MONGODB_URI` y `BACKUP_CLAVE` (≥ 16 caracteres, guardala en tu gestor de contraseñas); **hacé el repo privado** antes (hoy es público). Corré una vez el workflow «Respaldo diario» y **repetí la prueba de restauración sobre la base real** (`docs/DESPLIEGUE-NUEVO-CLIENTE.md`, paso 5); anotá fecha y resultado en `docs/SEGURIDAD.md`.
- Activar en GitHub **«Private vulnerability reporting»** (es el contacto de `security.txt`).

## 3. Limpieza y Fudo (G8)
- Borrar el proyecto duplicado `geacofi` de Vercel y el Supabase `capo` (los datos viejos se descartan, ya decidido).
- **Preguntar a Fudo** (por mail, con nombre de cuenta y usuario `api@…`) si su API **crea ventas** con ítems, modalidad y cliente, qué cuesta y si la versión es estable. **El adaptador Fudo no se construyó**: `ACTA-fudo.md` lo condiciona a esa confirmación y no la hay. Si dice que sí, se hace una función chica que traduce el pedido (ya existe el registro de pedidos con estados).

## 4. Paquete Completo (cuando haya un cliente que lo pague)
- **Mercado Pago:** cuenta del cliente, access token y webhook con firma (S6; hoy no hay webhooks, así que no hay nada que revisar).
- **WhatsApp Business API:** para avisos automáticos desde el servidor (hoy el respaldo es el WhatsApp que abre el navegador del cliente con el pedido y un código).
- **Factura electrónica:** proveedor certificado (ARCA) y sus credenciales.

## 5. Para vender
- **V3 y V10** (demo separada y café piloto): pasos en `docs/DEMO-Y-PILOTO.md`; checklist y contrato borrador (para el abogado) en `docs/KIT-PILOTO.md`. El «modo demo» con cartel todavía no existe: se hace al armar la demo (V3).
- **V6** licencia y contrato con abogado (el soporte por escrito propuesto está en `docs/PAQUETES.md`). **S12** política de privacidad y términos (Ley 25.326).
- **V8** completar en `docs/venta/index.html`: contacto, video de 20–30 s y caso real. **Manual:** poner el contacto de soporte en `docs/manual/manual-dueno.html` y regenerar el PDF.
- **Validar precios** (`docs/PAQUETES.md`) con un café real; precios y dólar de `docs/COSTO-3-ANOS.md` se vuelven a tomar el día de la venta (el producto es de ticket bajo: no justifica USD 10.000 por sí solo).

## Decisiones que tomé yo (cambialas si no te gustan)
- La contraseña del panel exige 2FA en producción: si no cargás `ADMIN_TOTP_SECRET`, el login queda cerrado (a propósito).
- Los pedidos se borran solos a los 90 días y no se guarda la IP del cliente.
- No hay roles múltiples: una sola cuenta (la dueña). Si hace falta un empleado con menos permisos, es trabajo nuevo.
