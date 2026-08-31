/**
 * `useLocaleSwitch` — the language change on the public pages, done right:
 * persists the choice (via the root provider — the pinned `/en` provider
 * chains up) and NAVIGATES to the twin route so the address keeps
 * mirroring the language. Without the replace, a pt choice inside `/en`
 * would keep rendering English (the tree's provider is pinned), and an
 * en choice on `/` would wait for the layout bounce.
 */

import type { Locale } from "@patch-careers/i18n";
import { type Href, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { twinPath } from "./twin-path";

export function useLocaleSwitch(): (target: Locale) => void {
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  return useCallback(
    (target: Locale) => {
      if (target !== locale) setLocale(target);
      const search = typeof window !== "undefined" ? window.location.search : "";
      const twin = twinPath(pathname, target, search);
      if (twin !== `${pathname}${search}`) router.replace(twin as Href);
    },
    [locale, setLocale, pathname, router],
  );
}
