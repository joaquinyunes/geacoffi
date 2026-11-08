# Deploy de GeaCofi

Sitio Vite multipágina + funciones en `api/` (`contenido`, `foto`, `login`, `pedido`, `auditoria`, `salud`) que guardan en MongoDB Atlas. El panel está en `/admin.html`. Para una instancia nueva seguí `docs/DESPLIEGUE-NUEVO-CLIENTE.md`; la seguridad está en `docs/SEGURIDAD.md`.

## Variables de entorno

Nunca se commitean (`.env*` está en `.gitignore`). En Vercel: Settings > Environment Variables. En local: un `.env` en la raíz.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `MONGODB_URI` | sí | Cadena de MongoDB Atlas (Connect > Drivers). Ahí se guardan contenido y fotos. |
| `MONGODB_DB` | no | Nombre de la base. Por defecto `geacoffi`. |
| `ADMIN_PASSWORD_HASH` | sí | Hash scrypt de la contraseña del panel (≥ 12 caracteres). Se genera con `node tools/clave.mjs`. |
| `ADMIN_TOTP_SECRET` | sí en producción | Secreto del 2FA (código de 6 números en el celular). Lo genera `tools/clave.mjs`. Sin él, en producción el login queda cerrado. |
| `ADMIN_PASSWORD` | solo desarrollo | Contraseña en claro (≥ 12 caracteres) en vez del hash. No usar en producción. |
| `BACKUP_CLAVE` | para respaldos | Clave con la que se cifra el respaldo (`tools/backup.mjs`, workflow de respaldo). |
| `ORIGENES_PERMITIDOS` | no | Otros dominios que pueden llamar a la API (ej. una copia del front en Render), separados por coma. Sin ella, solo el mismo sitio. |

## Atlas

1. Crear un usuario de base de datos con permisos solo sobre la base de GeaCofi.
2. Network Access: Vercel usa IPs dinámicas, así que hay que permitir `0.0.0.0/0` (la protección es el usuario y la contraseña de la cadena).
3. Las colecciones (`contenido`, `fotos`, `pedidos`, `auditoria`, `sesiones`, `limites`) se crean solas. Atlas Free no hace backups: usar `tools/backup.mjs`.

## Probar en local

```bash
node tools/mongo-local.mjs        # Mongo descartable en el puerto 27019 (en memoria)
```

En otra terminal, con `MONGODB_URI`, `MONGODB_DB` y `ADMIN_PASSWORD` (≥ 12 caracteres) definidas en `.env` o en el entorno:

```bash
npm run dev                       # el servidor de Vite también sirve /api/*
```

Abrir `http://localhost:5173/admin.html`. Las pruebas automáticas (`npm test`) levantan su propio Mongo en memoria.

## Antes de publicar

```bash
npm test
npx tsc --noEmit
npm run build
```
