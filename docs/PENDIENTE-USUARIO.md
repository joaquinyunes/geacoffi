# Lo que te toca a vos (GeaCofi) — actualizado el 08/11/2026

Todo lo de código y documentos de este proyecto está hecho. Lo que sigue necesita tus cuentas, tus decisiones o a un tercero.

## G7 — Publicar con base real (Vercel + Atlas)
1. **Atlas:** crear el cluster y un usuario solo para la base de GeaCofi; Network Access `0.0.0.0/0`. Si querés que el registro de cambios sea inborrable desde la app: rol con `insert`/`find` sobre `auditoria` y `readWrite` sobre el resto (`docs/SEGURIDAD.md`).
2. **Contraseña y 2FA:** en tu computadora `node tools/clave.mjs` (pide una contraseña de ≥ 12 caracteres). Copiá `ADMIN_PASSWORD_HASH` y `ADMIN_TOTP_SECRET` a Vercel y cargá el secreto en la app de autenticación del celular.
3. **Vercel** (proyecto `geacoffi`; el `geacofi` es el duplicado de G8): Environment Variables de Production: `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`. Redeploy de `main` (o de la rama que elijas). **Atención:** el plan Hobby es «personal, no comercial»; para cobrar a un cliente hace falta Pro.
4. Verificar: `node tools/verificar-instancia.mjs https://<tu-url>` → tiene que dar «Todo en orden».
5. Re-medir G6 en producción: `node tools/medir-peso.mjs https://<tu-url> 15` (ver `docs/RENDIMIENTO.md`).

## G8 — Limpieza y Fudo
- Borrar el proyecto duplicado `geacofi` de Vercel y el Supabase `capo` (los datos viejos se descartan, ya decidido).
- **Preguntar a Fudo** (por mail, con nombre de cuenta y usuario `api@…`) si su API **crea ventas** con ítems, modalidad y cliente, qué cuesta y si la versión es estable. **El adaptador Fudo no se construyó**: `ACTA-fudo.md` pone como condición esa confirmación, y no la hay. Si responde que sí, se hace una función chica que traduce el pedido (ya hay un registro de pedidos con estados al que enchufarla).

## Credenciales de integraciones (paquete Completo; no están en este paso)
- **Mercado Pago**: cuenta del cliente, access token y webhook con firma (S6).
- **WhatsApp Business API**: para que el servidor mande avisos automáticos (hoy el respaldo es el WhatsApp que abre el navegador del cliente con el pedido y un código).
- **Factura electrónica**: proveedor certificado (AFIP/ARCA) y sus credenciales.

## Para vender (V)
- **V3** y **V10** (demo separada y café piloto): pasos en `docs/DEMO-Y-PILOTO.md`. Hoy lo que se muestra son capturas de un entorno de prueba, etiquetadas.
- **V6** licencia y contrato con abogado (el soporte por escrito está en `docs/PAQUETES.md`).
- **V8** completar en `docs/venta/index.html`: contacto, video de 20–30 s y el caso real cuando exista. **Soporte** en el manual del dueño (`docs/manual/manual-dueno.html` → regenerar el PDF).
- **V10** café piloto: validar los precios de `docs/PAQUETES.md` con un café real; precios y dólar de `docs/COSTO-3-ANOS.md` se vuelven a tomar el día de la venta.
- **V7** crear la cuenta de UptimeRobot (o similar) y Sentry; cargar `SITIO_URL` como variable del repo.
- **S10** activar respaldo: secretos `MONGODB_URI` y `BACKUP_CLAVE` en el repo, **hacer el repo privado** (hoy es público), y repetir la prueba de restauración sobre la base real.
- **S9** activar en GitHub «Private vulnerability reporting» (es el contacto de `security.txt`).
- **S12** política de privacidad y términos con un profesional (Ley 25.326).
- Número de **WhatsApp** que recibe los pedidos: cargarlo en el panel (`Datos del local`); hoy está vacío y el cliente abre el chat y pega el pedido.
