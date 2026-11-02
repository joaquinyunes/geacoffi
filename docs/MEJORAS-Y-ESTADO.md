> Archivo vivo: qué se hizo y qué falta en este proyecto. Misma base que `soluciones-repos/ESTADO-PROYECTOS/geacoffi.md` (31/10/2026). Cada sesión lo actualiza al terminar.

# geacoffi (café) — rama de trabajo `perf/movil` · `cb2d279`

## Hecho
- Contenido, fotos y panel pasados de Supabase a **MongoDB** (funciones de Vercel `api/contenido.ts`, `foto.ts`, `login.ts`; `server/*`). Panel con una contraseña (`ADMIN_PASSWORD`). 28 tests, `tsc` y build OK según la sesión; panel probado en navegador según su informe.
- `docs/DEPLOY.md`, `ACTA-fudo.md` (tribunal sobre integrar Fudo: 11 de 12 jurados en contra salvo condiciones).
- La sesión de rendimiento (WP-42) ya hizo su primer commit en `perf/movil`.

## ⚠️ Riesgo
**11 archivos del panel Mongo siguen sin commitear** (`admin.js`, `negocio.js`, `package.json`, `api/`, `server/`, `docs/`, `tools/`, `ACTA-fudo.md`...). La rama `feat/panel-mongo-verificado` apunta al commit inicial (vacía). Commitear cuando WP-42 termine, y fusionar con `feat/diseno-a11y` (WP-40).

## Falta (código)
- **Datos viejos de Supabase: descartados por decisión.** WP-09 queda reducido a verificar el panel.
- WP-25 (condicionado por `ACTA-fudo.md`): estado del pedido para el cliente, respaldo automático por WhatsApp y alerta si falla; adaptador Fudo **solo si** Fudo confirma que su API crea ventas.
- Rendimiento: 6,8 MB en celular (WP-42, en curso). Doble `<h1>` (WP-40).

## Te toca a vos
1. En Vercel: `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD` (con OK por proyecto) y redeploy.
2. Borrar el proyecto duplicado `geacofi` de Vercel.
3. Borrar el Supabase `capo` cuando quieras (los datos se descartan).
4. Preguntar a Fudo si su API crea ventas (condición del tribunal).
