/**
 * `twinPath` — the same public page in the other language tree, query
 * string preserved. Pure so specs can exercise it without pulling
 * expo-router into the test environment.
 */

import type { Locale } from "@patch-careers/i18n";

export function twinPath(pathname: string, target: Locale, search: string): string {
  const bare =
    pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  // Only public screens have real `/en` twins. The signed-in app follows the
  // selected locale through I18nProvider and keeps canonical URLs unprefixed.
  if (!isPublicLocalePath(bare)) return `${bare}${search}`;
  const prefixed = target === "en" ? (bare === "/" ? "/en" : `/en${bare}`) : bare;
  return `${prefixed}${search}`;
}

export function isPublicLocalePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/verify-email" ||
    pathname === "/2fa-verify" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/u/")
  );
}
