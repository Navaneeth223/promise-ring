import { defineConfig } from 'vite';

export default defineConfig({
  // Expose public dir for frames and assets
  publicDir: 'public',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,   // never inline frames/assets
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three')) return 'three';
          if (id.includes('gsap')) return 'gsap';
          if (id.includes('lenis')) return 'lenis';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'gsap', 'lenis'],
  },
  server: {
    port: 5188,
    open: false,
  },
});
