import { env } from '$env/dynamic/public';

// Dynamic: pulls active jobs + public profiles from backend on each request,
// cached 1h upstream.
export const prerender = false;

const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/identity/sign-in', changefreq: 'monthly', priority: '0.4' },
  { path: '/identity/sign-up', changefreq: 'monthly', priority: '0.4' },
  { path: '/careers/browse-jobs', changefreq: 'hourly', priority: '0.9' },
  { path: '/social/feed', changefreq: 'daily', priority: '0.6' },
  { path: '/legal/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/contact', changefreq: 'yearly', priority: '0.3' },
];

type JobItem = { id: string; updatedAt?: string; createdAt?: string };
type UserItem = { username?: string; updatedAt?: string };

async function fetchActiveJobs(apiBase: string): Promise<JobItem[]> {
  try {
    // P0-#21: backend mounts all routes under `/api/v1/...` — previous
    // `/v1/...` 404'd and the try/catch silently dropped every job from
    // the sitemap (invisible to Google).
    const res = await fetch(`${apiBase}/api/v1/jobs?limit=100`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: JobItem[]; data?: JobItem[] };
    return body.items ?? body.data ?? [];
  } catch {
    return [];
  }
}

async function fetchPublicProfiles(apiBase: string): Promise<UserItem[]> {
  try {
    // P0-#21: same path-prefix fix as fetchActiveJobs above.
    const res = await fetch(`${apiBase}/api/v1/users/public?limit=500`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: UserItem[]; data?: UserItem[] };
    return body.items ?? body.data ?? [];
  } catch {
    return [];
  }
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const baseUrl = (env.PUBLIC_APP_URL ?? 'https://patch.careers').replace(/\/$/, '');
  const apiBase = (env.PUBLIC_API_URL ?? 'https://api.patch.careers').replace(/\/$/, '');
  const now = new Date().toISOString();

  const [jobs, profiles] = await Promise.all([
    fetchActiveJobs(apiBase),
    fetchPublicProfiles(apiBase),
  ]);

  const entries: string[] = [];
  for (const s of STATIC_ROUTES) {
    entries.push(urlEntry(`${baseUrl}${s.path}`, now, s.changefreq, s.priority));
  }
  for (const job of jobs) {
    const lastmod = job.updatedAt ?? job.createdAt ?? now;
    entries.push(urlEntry(`${baseUrl}/careers/browse-jobs/${job.id}`, lastmod, 'daily', '0.7'));
  }
  for (const profile of profiles) {
    if (!profile.username) continue;
    const lastmod = profile.updatedAt ?? now;
    entries.push(
      urlEntry(`${baseUrl}/my-profile/public/@${profile.username}`, lastmod, 'weekly', '0.6'),
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
