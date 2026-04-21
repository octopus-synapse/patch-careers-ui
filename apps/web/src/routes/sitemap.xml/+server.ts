import { env } from '$env/dynamic/public';

export const prerender = true;

/**
 * Minimal sitemap. We only list static public routes here — a production
 * deploy should extend this to include every public `@[username]` profile
 * and job detail page by paginating the backend.
 */
const STATIC_ROUTES = [
  '/',
  '/identity/sign-in',
  '/identity/sign-up',
  '/careers/browse-jobs',
  '/social/feed',
];

export async function GET() {
  const baseUrl = (env.PUBLIC_APP_URL ?? 'https://patch.careers').replace(/\/$/, '');
  const now = new Date().toISOString();
  const urls = STATIC_ROUTES.map(
    (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${path === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${path === '/' ? '1.0' : '0.7'}</priority>
  </url>`,
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
