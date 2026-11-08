# Monitoreo y qué hacer si se cae (V7)

## Qué hay armado
- **`/api/salud`**: responde 200 `{ ok: true }` si la función y la base están vivas, 503 si no. No expone datos.
- **Workflow `Monitoreo`** (`.github/workflows/uptime.yml`): cada 15 minutos pide `/api/salud`. Si falla, el job queda en rojo y GitHub avisa por mail al dueño del repo. Requiere la variable `SITIO_URL` (Settings → Variables → Actions). *Límite:* GitHub puede demorar las ejecuciones programadas varios minutos y desactiva los workflows de repos sin actividad en 60 días.
- **Vercel no duerme las funciones** del plan Pro y el front es estático. Atlas Free **se pausa tras 60 días sin actividad**: con el monitoreo pidiendo la base cada 15 minutos no pasa.
- **Pedidos sin atender**: el panel marca en rojo los pedidos sin respuesta a los 10 minutos.

## Qué falta (👤, requiere cuentas)
- **UptimeRobot** (u otro) apuntando a `/api/salud` con aviso por WhatsApp/mail al soporte — más confiable que el workflow (cada 5 min en el plan gratis). Crear la cuenta lo hace quien mantiene.
- **Errores a un panel (Sentry o similar):** no se instaló (necesita DSN de una cuenta). Mientras tanto, los errores del servidor quedan en **Vercel → Logs** (`console.error` de `ruta()`), y los intentos fallidos y cambios en el registro del panel. Cuando haya cuenta: agregar el SDK en `server/http.ts` (`ruta`), un solo lugar.

## Runbook: «se cayó»
1. **¿Abre la portada?** Sí → el problema es solo de funciones/base. No → Vercel: ver https://www.vercel-status.com y el último deploy (Deployments → «Rollback» al anterior que funcionaba).
2. **`/api/salud` da 503**: casi siempre es la base. En Atlas: ¿el cluster está pausado o con la IP bloqueada? (Network Access debe tener `0.0.0.0/0`). ¿Cambió la contraseña del usuario de la base? Actualizar `MONGODB_URI` en Vercel y redeploy.
3. **El panel no deja entrar** («no está configurado»): falta `ADMIN_PASSWORD_HASH` o `ADMIN_TOTP_SECRET` en Vercel (con `VERCEL_ENV=production` sin 2FA el login queda cerrado a propósito).
4. **Perdió el celular del 2FA**: generar con `node tools/clave.mjs` un secreto nuevo, cargarlo en Vercel (`ADMIN_TOTP_SECRET`), redeploy y entregar el nuevo a la dueña. Cerrar todas las sesiones.
5. **Se borró contenido**: `docs/SEGURIDAD.md` → restauración: `node tools/restaurar.mjs <respaldo>` en una **base nueva**, verificar y recién ahí cambiar `MONGODB_DB`.
6. **Mientras tanto**: los clientes siguen escribiendo por WhatsApp (el pedido siempre sale por WhatsApp; el panel es un extra). Avisarle a la dueña que atienda por ahí.
7. Anotar hora de inicio, causa y arreglo para el informe del mes.
