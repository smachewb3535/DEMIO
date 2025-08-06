import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/js'),
      '@css': resolve(__dirname, 'src/css'),
      '@assets': resolve(__dirname, 'public/assets')
    }
  }
})