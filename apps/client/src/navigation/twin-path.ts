/**
 * `twinPath` — the same public page in the other language tree, query
 * string preserved. Pure so specs can exercise it without pulling
 * expo-router into the test environment.
 */

import type { Locale } from "@patch-careers/i18n";
import { pathForLocale } from "./route-locale";

export function twinPath(pathname: string, target: Locale, search: string, hash = ""): string {
  return `${pathForLocale(pathname, target)}${search}${hash}`;
}
