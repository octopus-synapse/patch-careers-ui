/**
 * The settings sections, in the order they are read.
 *
 * One list, three readers: the desktop single page stacks the bodies in this
 * order and spies on the scroll to light the rail; the rail renders these as
 * its items; and the drill-down screens (change e-mail, 2FA, blocked…) match
 * their pathname against `children` to keep their parent section lit.
 *
 * Ordered deliberately — account first because it is where people land, and
 * because `/settings` with no `?section=` opens at the top of it.
 */

import { Bell, LockKeyhole, Palette, UserRound } from "lucide-react-native";
import type { ComponentType } from "react";

export type SettingsSectionId = "account" | "privacy" | "notifications" | "preferences";

type Glyph = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type SettingsSection = {
  readonly id: SettingsSectionId;
  readonly labelKey: string;
  /** The one-line summary under the section's heading. */
  readonly descriptionKey: string;
  readonly icon: Glyph;
  /** Drill-down routes that keep this section lit (URL prefix match). */
  readonly children: readonly string[];
};

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: "account",
    labelKey: "settings.account.title",
    descriptionKey: "settings.account.description",
    icon: UserRound,
    children: [
      "/settings/change-email",
      "/settings/change-password",
      "/settings/two-factor",
      "/settings/username",
      "/settings/connected-accounts",
      "/settings/verify-code",
    ],
  },
  {
    id: "privacy",
    labelKey: "settings.privacy.title",
    descriptionKey: "settings.privacy.description",
    icon: LockKeyhole,
    // `/settings/consent` is reachable from the privacy pane, so it lights it.
    children: ["/settings/blocked", "/settings/consent"],
  },
  {
    id: "notifications",
    labelKey: "settings.notifications.title",
    descriptionKey: "settings.notifications.intro",
    icon: Bell,
    children: [],
  },
  {
    id: "preferences",
    labelKey: "settings.preferences.title",
    descriptionKey: "settings.preferences.description",
    icon: Palette,
    children: [],
  },
];

/**
 * The single page, opened at a given section. Typed as the literal so it
 * satisfies expo-router's typed routes without a cast at every call site.
 */
export function settingsSectionHref(
  id: SettingsSectionId,
): `/settings?section=${SettingsSectionId}` {
  return `/settings?section=${id}`;
}

/**
 * Which section a drill-down belongs to, or `null` off the settings tree. The
 * section roots themselves no longer exist as panes on desktop — they redirect
 * into the single page — but they still resolve here for the moment between
 * the route mounting and the redirect landing.
 */
export function settingsSectionForPath(pathname: string): SettingsSectionId | null {
  for (const section of SETTINGS_SECTIONS) {
    if (pathname === `/settings/${section.id}`) return section.id;
    if (section.children.some((child) => pathname.startsWith(child))) return section.id;
  }
  return null;
}
