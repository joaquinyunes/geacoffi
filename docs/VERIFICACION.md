# Verificación (08/11/2026) — números reales, corridos al cerrar

Rama `integracion` con `feat/diseno-a11y` y `chore/seguridad-ci` fusionadas (sin conflictos).

| Control | Comando | Resultado |
|---|---|---|
| Tests | `npx vitest run` | **58 / 58** en 8 archivos (antes de esta tanda: 29) |
| Tipos | `npx tsc --noEmit` | 0 errores |
| Build | `npm run build` | ✓ (JS principal 632 kB, 172,85 kB gzip) |
| Auditoría | `npm audit --omit=dev` | **0 vulnerabilidades** (`--audit-level=high` sale con 0) |
| Lint | `npm run lint` | sin avisos |
| Instancia local de producción | `node tools/servir.mjs` + `node tools/verificar-instancia.mjs` | **10 / 10** controles |
| Peso de la portada en celular (375 px, Slow 4G, CPU 4×) | `node tools/medir-peso.mjs` | **934.186 B = 0,89 MiB** (< 1 MB), 19 pedidos, LCP 1,05 s. *(La cifra de 0,82 MiB del 08/11 era un artefacto del navegador integrado: ver `docs/RENDIMIENTO.md`)* |
| `/admin.html` | idem | 176.842 B |
| Secretos en todo el historial | regex del CI sobre `git log --all -p` | 0 coincidencias (8 commits al empezar) |

## Probado en el navegador (G2), contra el build servido con la CSP en bloqueo
Login con clave mala (mensaje «La contraseña no es correcta.») y buena; con 2FA, código de la app; cookie `HttpOnly` (no visible desde JS); editar precio, WhatsApp y horarios; agregar un evento; **subir una foto** por el input real (se convierte a WebP, el servidor la guarda y la sirve); Guardar → la carta de la web muestra el precio nuevo (`$1.500`); registro de cambios con el antes y el después; un pedido armado en la carta sale por WhatsApp con el código (`Pedido #5B5B`), aparece en el panel, se **acepta** y el ticket del cliente cambia a «Aceptado» (consulta cada 15 s); si el registro falla (red cortada simulada) el ticket muestra la alerta y el WhatsApp sale igual.

## Qué cubren los 58 tests
`server/contenido.test.ts` (guardar exige sesión y `x-gc`, validación, operadores `$`, auditoría, fotos por bytes, 3 MB) · `server/login.test.ts` (TOTP contra el vector de la RFC 6238, un código no vale dos veces, bloqueo tras 5 fallos con `Retry-After`, cierre en todos los dispositivos, cookie, hash scrypt, `tools/clave.mjs`, clave corta rechazada) · `server/pedido.test.ts` (estados y transiciones, rechazo con motivo, id del cliente, abuso, `/api/salud`) · `mensajes.test.js` (sin texto técnico) · `pedido-texto.test.js` · `tools/respaldo.test.mjs` (respaldo cifrado → restauración).

## Prueba de despliegue de cero (V4)
Clon limpio de la rama (`git clone`) → `npm ci` 11 s → `npm run build` 7 s → `tools/servir.mjs` (Mongo en memoria) → `tools/verificar-instancia.mjs`: **10 / 10 controles, 21 s en total** (con la caché de npm caliente). La parte en nube (Atlas, Vercel, dominio) depende de las cuentas del cliente y se estima en menos de 1 hora (`docs/DESPLIEGUE-NUEVO-CLIENTE.md`); **no se probó contra Atlas/Vercel reales**.

## No verificado
- Nada contra Atlas, Vercel ni Mercado Pago/WhatsApp reales (sin credenciales).
- Tiempo de carga en red de celular real y en producción.
- La CSP se probó en el navegador integrado (Chromium); no en Safari/Firefox.
- El flujo de subida de fotos se probó con una imagen generada en canvas, no con una foto de celular.
