import { Briefcase, LayoutDashboard, Rss, Search, Users } from 'lucide-svelte';
import type { ComponentType } from 'svelte';
import type { AppContext } from '$lib/state/active-context.svelte';
import { ADMIN_NAV_LINKS } from '../../../routes/[[lang=lang]]/platform/admin/_components/admin-nav-links';

export type NavLink = {
  /** i18n key — used by callers that translate at render time (mobile menu). */
  key: string;
  /** Pre-resolved label string — used by desktop navbar. */
  label: string;
  href: string;
  icon: ComponentType;
  exact?: boolean;
  flagKey?: string;
  /** Admin context only: true for items pinned in the navbar; false → overflow ("More" dropdown). */
  primary?: boolean;
};

export type GetNavLinksOpts = {
  t: (key: string) => string;
  homeLabel: string;
  flagsEnabled: (key: string) => boolean;
};

const ADMIN_PRIMARY_HREFS = new Set<string>([
  '/platform/admin',
  '/platform/admin/users',
  '/platform/admin/analytics',
  '/platform/admin/feature-flags',
  '/platform/admin/dev-tools',
]);

export function getNavLinks(ctx: AppContext, opts: GetNavLinksOpts): NavLink[] {
  const { t, homeLabel, flagsEnabled } = opts;
  let links: NavLink[];

  if (ctx === 'candidate') {
    links = [
      {
        key: 'nav.dashboard',
        label: homeLabel,
        href: '/my-profile/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'nav.feed',
        label: t('nav.feed'),
        href: '/social/feed',
        icon: Rss,
        flagKey: 'social.feed',
      },
      {
        key: 'nav.jobs',
        label: t('nav.jobs'),
        href: '/careers/browse-jobs',
        icon: Briefcase,
        flagKey: 'jobs',
      },
      {
        key: 'nav.myNetwork',
        label: t('nav.myNetwork'),
        href: '/social/network',
        icon: Users,
        flagKey: 'social.network',
      },
    ];
  } else if (ctx === 'recruiter') {
    links = [
      { key: 'nav.myJobs', label: t('nav.myJobs'), href: '/recruiting/jobs', icon: Briefcase },
      {
        key: 'nav.candidates',
        label: t('nav.candidates'),
        href: '/recruiting/search-candidates',
        icon: Search,
      },
    ];
  } else {
    links = ADMIN_NAV_LINKS.map((l) => ({
      key: l.labelKey,
      label: t(l.labelKey),
      href: l.href,
      icon: l.icon,
      exact: l.exact,
      flagKey: l.flagKey,
      primary: ADMIN_PRIMARY_HREFS.has(l.href),
    }));
  }

  return links.filter((l) => !l.flagKey || flagsEnabled(l.flagKey));
}

export function homeOf(ctx: AppContext): string {
  switch (ctx) {
    case 'candidate':
      return '/my-profile/dashboard';
    case 'recruiter':
      return '/recruiting/jobs';
    case 'admin':
      return '/platform/admin';
  }
}

/**
 * Derives the context from a pathname. Returns null for pathnames that do
 * not belong to a specific context (e.g. /social/feed is candidate-default
 * but is reachable from any context — callers should not auto-switch on it).
 */
export function pathContext(pathname: string): AppContext | null {
  if (pathname === '/platform/admin' || pathname.startsWith('/platform/admin/')) return 'admin';
  if (pathname === '/recruiting' || pathname.startsWith('/recruiting/')) return 'recruiter';
  return null;
}
