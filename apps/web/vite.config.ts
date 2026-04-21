import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    include: ['api-client'],
  },
  ssr: {
    noExternal: ['api-client'],
  },
  build: {
    // Split vendor chunks so a trivial `lucide-svelte` icon import doesn't
    // re-invalidate the entire app bundle on HMR rebuilds, and so the first
    // paint can load user code in parallel with vendor code.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-svelte')) return 'vendor-icons';
            if (id.includes('@tanstack')) return 'vendor-query';
          }
          if (id.includes('packages/api-client')) return 'api-client';
          if (id.includes('packages/ui/')) return 'ui';
          if (id.includes('packages/i18n/')) return 'i18n';
          return undefined;
        },
      },
    },
  },
});
