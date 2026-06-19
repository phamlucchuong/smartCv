import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  return {
    plugins: [
      TanStackRouterVite(),
      react(),
      tailwindcss(),
    ],
    define: {
      __SMART_CV_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8080'),
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: '../../test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: '../../coverage/web-candidate',
        include: ['src/store/**/*.ts', 'src/routes/**/*.tsx', 'src/components/layouts/**/*.tsx'],
      },
    },
    server: {
      port: Number(env.VITE_WEB_CANDIDATE_PORT) || 3000,
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
  }
})
