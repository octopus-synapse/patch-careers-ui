# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/protected-routes.spec.ts >> Protected routes >> dashboard should redirect to /login when not authenticated
- Location: test/infrastructure/e2e/auth/protected-routes.spec.ts:4:2

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/login" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]: "500"
    - heading "Internal Error" [level=1] [ref=e5]
  - generic [ref=e8]:
    - generic [ref=e9]: "Failed to load url /@fs/home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts (resolved id: /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts) in /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/index.ts. Does the file exist?"
    - generic [ref=e10]: "Error: Failed to load url /@fs/home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts (resolved id: /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts) in /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/index.ts. Does the file exist? at loadAndTransform (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:35730:17) at async fetchModule (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:46883:16) at async handleInvoke (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:39026:22) at async EventEmitter.listenerForInvokeHandler (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:39099:19"
    - generic [ref=e11]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e12]: server.hmr.overlay
      - text: to
      - code [ref=e13]: "false"
      - text: in
      - code [ref=e14]: vite.config.ts
      - text: .
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Protected routes', () => {
  4  | 	test('dashboard should redirect to /login when not authenticated', async ({ page }) => {
  5  | 		await page.goto('/dashboard');
  6  | 
> 7  | 		await page.waitForURL('/login');
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  8  | 		expect(page.url()).toContain('/login');
  9  | 	});
  10 | });
  11 | 
```