import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  return {
    plugins: [TanStackRouterVite(), react(), tailwindcss()],
    define: {
      __SMART_CV_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8080'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: '../../test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: '../../coverage/web-recruiter',
        include: ['src/store/**/*.ts'],
      },
    },
    server: {
      port: Number(env.VITE_WEB_RECRUITER_PORT) || 3001,
    },
  }
})
