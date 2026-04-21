import type { RequestHandler } from './$types';

// 1200x630 is Twitter/LinkedIn's preferred OG image size. We return SVG with
// the proper content-type; social network crawlers rasterize on their end and
// it's cheaper than shipping satori + resvg.
export const GET: RequestHandler = async ({ url }) => {
  const title = (url.searchParams.get('title') ?? 'Patch Careers').slice(0, 120);
  const subtitle = (url.searchParams.get('subtitle') ?? '').slice(0, 160);

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#164e63"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="120" r="280" fill="#06b6d4" opacity="0.15"/>
  <circle cx="120" cy="540" r="200" fill="#8b5cf6" opacity="0.12"/>
  <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="#f8fafc">
    ${escapeXml(title)}
  </text>
  ${
    subtitle
      ? `<text x="80" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="400" fill="#cbd5e1">${escapeXml(subtitle)}</text>`
      : ''
  }
  <text x="80" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#67e8f9" letter-spacing="2">
    patch.careers
  </text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
