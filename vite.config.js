import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El panel usa BrowserRouter en la raíz del dominio.
  base: '/',
})
