# GeaCofi (café) — plan de venta (03/11/2026)
Leé primero `..\PLAN-VENTA-10K.md` (veredicto, paquetes **S** y **V**). Rama: `integracion` (`acd4194` = perf + panel Mongo). Sin `git push`. **No tocar el diseño 3D de scroll** (te gusta): solo seguridad, rendimiento y a11y.

**Frase de venta (a validar):** «Web de café con carta, eventos y pedidos que el dueño edita solo desde un panel, sin tocar código, y que carga rápido en el celular.»

## Estado auditado
- ✅ 29/29 tests · `npm audit` 0 · 1 archivo sin commitear (`PLAN-POR-PROYECTO.md`)
- ✅ panel Mongo (28 tests), portada 7,0 MB → 0,87 MB (medido local)
- ☐ **diseño a11y y seguridad CI sin fusionar** · ☐ panel integrado sin probar en navegador ni medir `/admin.html`
- ☐ textos técnicos del proveedor en mensajes del panel · ☐ WP-25 (estado del pedido + respaldo WhatsApp) · ☐ Fudo (¿su API crea ventas?)
- ☐ `tsc` y `build` no re-corridos hoy

## A. Pasos
- [x] **G1** 🤖 Fusionar `feat/diseno-a11y` y `chore/seguridad-ci` en `integracion` (conflictos probables: `admin.js`, `negocio.js`, `vercel.json`, `index.html`). `npx vitest run` (≥ 29), `npx tsc --noEmit`, `npm run build`.
- [x] **G2** 🤖 Probar el panel integrado en navegador: login, editar precios y eventos, subir foto, verlo en la web; medir `/admin.html`.
- [x] **G3** 🤖 Mensajes del panel sin texto técnico («No se guardó: <error>» → mensaje humano).
- [x] **G4** 🤖 Seguridad del panel (es lo único con login): S3 rate limit + bloqueo, S4 2FA, S5 validación y límites de subida (MIME real, tamaño, nombre de archivo), S7 registro de cambios, S2 CSP a bloquear, S8, S9, S10, S11, S13.
- [x] **G5** 🤖 **WP-25** estado del pedido para el cliente y respaldo automático por WhatsApp con alerta si falla; adaptador Fudo **solo** si Fudo confirma que su API crea ventas (ver `ACTA-fudo.md`).
- [x] **G6** 🤖 Re-medir peso y tiempo en producción tras el deploy (portada < 1 MB en celular).
- [ ] 👤 **G7** Vercel: `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD`; redeploy.
- [ ] 👤 **G8** Borrar `geacofi` (duplicado) y el Supabase `capo`; los datos viejos se descartan · preguntar a Fudo si su API crea ventas.

## B. Para vender (de `..\PLAN-VENTA-10K.md` §4)
- [x] V1 paquetes (este es de ticket bajo: instalación + mensual, no USD 10.000 salvo que incluya pedidos/Fudo) · [x] V2 tabla a 3 años contra una web de café en suscripción · [ ] V3 demo aparte · [x] V4 despliegue repetible · [x] V5 manual del dueño (cambiar precio, evento, foto) · [x] V7 uptime (parcial: falta cuenta de UptimeRobot/Sentry) · [x] V8 página (con campos [COMPLETAR]) de venta · [ ] V10 café piloto

## Hecho el 08/11/2026 (ver docs/VERIFICACION.md, docs/PENDIENTE-USUARIO.md)
- G5: estado del pedido + respaldo por WhatsApp con código y alerta si falla. **Adaptador Fudo NO construido**: ACTA-fudo.md exige que Fudo confirme que su API crea ventas y no hay confirmación.
- G6: portada 0,82 MiB en celular medida con el build local; **tiempo en producción sin medir** (no hay deploy de esta versión: G7 es tuyo).
- Todo lo 👤 y los límites: docs/PENDIENTE-USUARIO.md.

## Salida
☑ commits ☑ tests (58)/tsc/build/audit verdes ☑ el panel guarda y la web lo muestra ☑ portada < 1 MB en celular (local) ☑ backup restaurado (en Mongo de prueba; falta en Atlas real) ☐ café piloto
