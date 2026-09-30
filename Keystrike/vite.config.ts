import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 1430,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**', '**/release/**', '**/data/**', '**/docs/**'] },
  },
  build: { target: 'es2022' },
});
