import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8123',
        changeOrigin: true
      },
      '/static': {
        target: 'http://127.0.0.1:8123',
        changeOrigin: true
      },
      '/graphify-out': {
        target: 'http://127.0.0.1:8123',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000
  }
});
