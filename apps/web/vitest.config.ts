import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    alias: {
      $lib: path.resolve('./src/lib'),
      '$app/environment': path.resolve('./src/test/mocks/app-environment.ts'),
    },
  },
  resolve: {
    conditions: ['browser'],
  },
});
