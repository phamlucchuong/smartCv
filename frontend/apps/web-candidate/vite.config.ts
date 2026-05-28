import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss()
  ],
  server: {
    port: 3002,
    // proxy: {
    //   '^.*$': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace(/^.*$/, (path) => path.replace(/\\\//g, '/')), // Fix backslashes
    //     configure: (proxy) => {
    //       proxy.on('error', (err) => {
    //         console.log('Proxy error:', err);
    //       });
    //     }
    //   },
    // },
  },
})
