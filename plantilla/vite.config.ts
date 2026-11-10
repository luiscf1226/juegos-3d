import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Todo en un solo JS y un solo CSS; tools/build.mjs los mete en un único HTML.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 5000,
    target: 'es2022',
  },
});
