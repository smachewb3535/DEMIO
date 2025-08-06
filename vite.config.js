import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Base configuration
  base: './',
  
  // Development server
  server: {
    port: 3000,
    host: true,
    open: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['three', 'gsap'],
          utils: ['lenis', 'tagcloud']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/js'),
      '@css': resolve(__dirname, 'src/css'),
      '@assets': resolve(__dirname, 'public/assets')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@css/variables.scss";`
      }
    }
  },
  
  // Optimization
  optimizeDeps: {
    include: ['three', 'gsap', 'lenis'],
    exclude: ['@unseenco/taxi']
  },
  
  // Plugin configuration
  plugins: [
    // Add plugins as needed
  ],
  
  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})