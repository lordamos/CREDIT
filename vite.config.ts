import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: { outDir: 'dist' },
  resolve: {
    alias: {
      '@types': path.resolve(__dirname, 'src/types'),
      'shared/types/credit': path.resolve(__dirname, 'src/types/credit'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:3002', changeOrigin: true },
    },
  },
});
