import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
		setupFiles: ['src/test/setup.ts'],
		alias: {
			'$lib': path.resolve('./src/lib'),
		}
	},
	resolve: {
		conditions: ['browser']
	}
});
