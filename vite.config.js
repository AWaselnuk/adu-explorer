import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path must match the GitHub repository name for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/adu-explorer/',
  build: {
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        fireplace: new URL('./fireplace.html', import.meta.url).pathname,
      },
    },
  },
})
