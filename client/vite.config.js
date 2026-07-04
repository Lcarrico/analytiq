import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // SSE needs buffering disabled
        configure: (proxy) => {
          proxy.on('proxyReq', (_, req) => {
            if (req.headers.accept === 'text/event-stream') {
              // Disable response buffering for SSE
            }
          });
        },
      },
    },
  },
});
