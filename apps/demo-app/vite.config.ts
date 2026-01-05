import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@guidle/sdk': resolve(__dirname, '../../packages/sdk/src/index.ts')
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
