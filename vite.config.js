import { defineConfig } from 'vite';

export default defineConfig({
  // Expose public dir for frames and assets
  publicDir: 'public',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,   // never inline frames/assets
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap:  ['gsap'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'gsap', 'lenis'],
  },
  server: {
    port: 5173,
    open: true,
  },
});
