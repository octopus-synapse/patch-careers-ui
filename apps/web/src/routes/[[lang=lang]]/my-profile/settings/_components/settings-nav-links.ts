import { AlertTriangle, AtSign, Lock, Palette, ShieldCheck, User } from 'lucide-svelte';
import type { ComponentType } from 'svelte';

export type SettingsNavLink = {
  href: string;
  labelKey: string;
  icon: ComponentType;
  exact?: boolean;
};

export const SETTINGS_NAV_LINKS: SettingsNavLink[] = [
  { href: '/my-profile/settings/profile', labelKey: 'settings.profile', icon: User },
  { href: '/my-profile/settings/username', labelKey: 'settings.username', icon: AtSign },
  { href: '/my-profile/settings/password', labelKey: 'settings.password', icon: Lock },
  { href: '/my-profile/settings/two-factor', labelKey: 'settings.twoFactor', icon: ShieldCheck },
  { href: '/my-profile/settings/preferences', labelKey: 'settings.preferences', icon: Palette },
  {
    href: '/my-profile/settings/danger-zone',
    labelKey: 'settings.dangerZone',
    icon: AlertTriangle,
  },
];

export function isSettingsPath(pathname: string): boolean {
  return pathname === '/my-profile/settings' || pathname.startsWith('/my-profile/settings/');
}
