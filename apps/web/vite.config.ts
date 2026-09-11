import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  envDir: '../..',
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:3001' } },
  test: {
    environment: 'jsdom',
    globals: true,
    maxWorkers: 1,
    pool: 'threads',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    exclude: ['node_modules/**', 'dist/**'],
  },
});
