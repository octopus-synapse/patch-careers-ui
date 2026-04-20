import { env } from '$env/dynamic/public';

export const prerender = true;

export async function GET() {
  const baseUrl = env.PUBLIC_APP_URL ?? 'https://patch.careers';
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /settings',
    'Disallow: /onboarding',
    'Disallow: /api',
    '',
    `Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
