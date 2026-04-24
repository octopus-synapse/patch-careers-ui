import {
  Activity,
  BarChart3,
  FileClock,
  Gauge,
  Layers,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Tags,
  Users,
  Wrench,
} from 'lucide-svelte';
import type { ComponentType } from 'svelte';

export type AdminNavLink = {
  href: string;
  labelKey: string;
  icon: ComponentType;
  exact?: boolean;
};

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { href: '/platform/admin', labelKey: 'admin.nav.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/platform/admin/users', labelKey: 'admin.nav.users', icon: Users },
  { href: '/platform/admin/analytics', labelKey: 'admin.nav.analytics', icon: BarChart3 },
  { href: '/platform/admin/skills', labelKey: 'admin.nav.skills', icon: Tags },
  { href: '/platform/admin/sections', labelKey: 'admin.nav.sections', icon: Layers },
  { href: '/platform/admin/onboarding', labelKey: 'admin.nav.onboarding', icon: ListChecks },
  { href: '/platform/admin/health', labelKey: 'admin.nav.health', icon: Activity },
  { href: '/platform/admin/performance', labelKey: 'admin.nav.performance', icon: Gauge },
  { href: '/platform/admin/chat', labelKey: 'admin.nav.chat', icon: MessageSquare },
  { href: '/platform/admin/audit', labelKey: 'admin.nav.audit', icon: FileClock },
  { href: '/platform/admin/dev-tools', labelKey: 'admin.nav.devTools', icon: Wrench },
];

export function isAdminPath(pathname: string): boolean {
  return pathname === '/platform/admin' || pathname.startsWith('/platform/admin/');
}
