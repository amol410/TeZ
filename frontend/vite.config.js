import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Build LMS frontend into frontend/dist/
    // The backend serves this at the root (tezsend.com/)
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174, // Different port from TezSend web (5173)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
