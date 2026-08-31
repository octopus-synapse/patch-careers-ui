/**
 * `twinPath` — the same public page in the other language tree, query
 * string preserved. Pure so specs can exercise it without pulling
 * expo-router into the test environment.
 */

import type { Locale } from "@patch-careers/i18n";

export function twinPath(pathname: string, target: Locale, search: string): string {
  const bare =
    pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
  const prefixed = target === "en" ? (bare === "/" ? "/en" : `/en${bare}`) : bare;
  return `${prefixed}${search}`;
}
