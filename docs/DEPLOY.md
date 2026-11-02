# Deploy de GeaCofi

Sitio Vite multipágina + funciones en `api/` (`contenido`, `foto`, `login`) que guardan en MongoDB Atlas. El panel está en `/admin.html`.

## Variables de entorno

Nunca se commitean (`.env*` está en `.gitignore`). En Vercel: Settings > Environment Variables. En local: un `.env` en la raíz.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `MONGODB_URI` | sí | Cadena de MongoDB Atlas (Connect > Drivers). Ahí se guardan contenido y fotos. |
| `MONGODB_DB` | no | Nombre de la base. Por defecto `geacoffi`. |
| `ADMIN_PASSWORD` | sí | Contraseña del panel `/admin.html`. Sin ella nadie puede entrar ni guardar (login responde 503). |
| `ORIGENES_PERMITIDOS` | no | Otros dominios que pueden llamar a la API (ej. una copia del front en Render), separados por coma. Sin ella, solo el mismo sitio. |

## Atlas

1. Crear un usuario de base de datos con permisos solo sobre la base de GeaCofi.
2. Network Access: Vercel usa IPs dinámicas, así que hay que permitir `0.0.0.0/0` (la protección es el usuario y la contraseña de la cadena).
3. Colecciones `contenido` y `fotos` se crean solas al primer guardado.

## Probar en local

```bash
node tools/mongo-local.mjs        # Mongo descartable en el puerto 27019 (en memoria)
```

En otra terminal, con `MONGODB_URI`, `MONGODB_DB` y `ADMIN_PASSWORD` definidas en `.env` o en el entorno:

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
