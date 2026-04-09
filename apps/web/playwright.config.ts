import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './test',
	webServer: {
		command: 'bun run dev',
		port: 5173,
		reuseExistingServer: true
	},
	use: {
		baseURL: 'http://localhost:5173'
	},
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } }
	]
});
