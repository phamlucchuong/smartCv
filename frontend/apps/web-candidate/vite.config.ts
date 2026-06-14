import { defineConfig } from 'vitest/config'
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: '../../test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: '../../coverage/web-candidate',
      include: ['src/store/**/*.ts'],
    },
  },
  server: {
    port: Number(process.env.VITE_WEB_CANDIDATE_PORT) || 3000,
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
