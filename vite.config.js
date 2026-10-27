import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutas relativas ('./assets/...') en lugar de absolutas ('/assets/...').
  // Así el build funciona igual en la raíz del dominio o en cualquier subcarpeta,
  // sin que el servidor devuelva 404 al buscar los assets.
  base: './',
})
