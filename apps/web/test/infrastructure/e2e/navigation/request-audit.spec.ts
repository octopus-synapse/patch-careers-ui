import { test } from '@playwright/test';

test('audit requests on page load', async ({ page }) => {
  const requests: { url: string; type: string; status: number }[] = [];

  page.on('response', (res) => {
    const url = res.url();
    if (url.startsWith('http://localhost:5173')) {
      requests.push({
        url: url.replace('http://localhost:5173', ''),
        type: res.request().resourceType(),
        status: res.status(),
      });
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Group by pattern
  const groups: Record<string, number> = {};
  for (const r of requests) {
    let key: string;
    if (r.url.includes('node_modules')) key = 'node_modules';
    else if (r.url.includes('.svelte-kit')) key = '.svelte-kit';
    else if (r.url.includes('/src/')) key = 'src';
    else if (r.url.includes('/@fs/')) key = '@fs';
    else if (r.url.includes('/@vite/')) key = '@vite';
    else if (r.url.endsWith('.css')) key = 'css';
    else key = 'other';
    groups[key] = (groups[key] ?? 0) + 1;
  }

  console.log(`\nTotal requests: ${requests.length}\n`);
  console.log('By group:');
  for (const [k, v] of Object.entries(groups).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // Show the top 20 longest paths
  console.log('\nAll request URLs:');
  for (const r of requests) {
    console.log(`  [${r.status}] ${r.url}`);
  }
});
