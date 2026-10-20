import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    // sitio de varias páginas: cada .html de la raíz es una entrada (rutas relativas a la raíz del proyecto)
    rollupOptions: { input: { main: 'index.html', detalles: 'detalles.html', carta: 'carta.html', armar: 'armar.html', admin: 'admin.html' } },
  },
  test: { environment: 'node' },
})
