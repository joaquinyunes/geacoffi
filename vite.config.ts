import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// En "npm run dev" sirve las funciones de api/ contra el MONGODB_URI del .env, igual que Vercel en producción.
const apiLocal = (): Plugin => ({
  name: 'api-local',
  configureServer(server) {
    Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
    server.middlewares.use(async (req, res, next) => {
      const nombre = /^\/api\/(contenido|foto|login)(\?|$)/.exec(req.url ?? '')?.[1]
      if (!nombre) return next()
      await (await server.ssrLoadModule(`/api/${nombre}.ts`)).default(req, res)
    })
  },
})

export default defineConfig({
  plugins: [react(), apiLocal()],
  build: {
    chunkSizeWarningLimit: 800,
    // sitio de varias páginas: cada .html de la raíz es una entrada (rutas relativas a la raíz del proyecto)
    rollupOptions: { input: { main: 'index.html', detalles: 'detalles.html', carta: 'carta.html', armar: 'armar.html', admin: 'admin.html' } },
  },
  test: { environment: 'node' },
})
