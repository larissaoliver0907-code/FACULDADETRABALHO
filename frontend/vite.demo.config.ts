import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build da prévia de demonstração: um único HTML com JS e CSS embutidos e a API simulada.
// Uso: npm run build:demo
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  define: { 'import.meta.env.VITE_DEMO': JSON.stringify('true') },
  build: { outDir: 'dist-demo', emptyOutDir: true },
})
