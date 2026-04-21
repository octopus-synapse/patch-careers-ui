import { env } from '$env/dynamic/public';

export const prerender = true;

export async function GET() {
  const baseUrl = env.PUBLIC_APP_URL ?? 'https://patch.careers';
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /platform/',
    'Disallow: /my-profile/settings',
    'Disallow: /my-profile/dashboard',
    'Disallow: /onboarding',
    'Disallow: /api',
    'Disallow: /recruiting',
    // Legacy paths (now 301 redirected) — keep disallowed in case of cached crawls
    'Disallow: /admin',
    'Disallow: /settings',
    'Disallow: /dashboard',
    'Disallow: /company',
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
