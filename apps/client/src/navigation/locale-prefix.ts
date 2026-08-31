/**
 * Locale-prefixed navigation for the public (unauthenticated) pages.
 *
 * On web the address mirrors the language: `/` and `/sign-in` are the
 * pt-BR canonicals, the English twins live under `/en`. Public screens
 * build their links through `useLocalizedHref` so navigation stays
 * inside the tree the visitor is on (the `/en` layout pins its
 * `I18nProvider` to `en`, so the hook resolves the right prefix in
 * both trees). Native never uses prefixes — there is one route tree.
 *
 * `useEnglishTwinRedirect` is the central enforcement: a public layout
 * renders its result to bounce `/sign-in` → `/en/sign-in` when the
 * resolved locale is English, preserving the query string (the
 * reset-password token rides there). Flows deeper in the app can keep
 * pushing the unprefixed constants — the bounce catches them all.
 */

import { type Href, usePathname } from "expo-router";
import { Platform } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function useLocalePathPrefix(): "" | "/en" {
  const { locale } = useI18n();
  if (Platform.OS !== "web") return "";
  return locale === "en" ? "/en" : "";
}

/** Prefix a public path with the locale segment when appropriate. */
export function useLocalizedHref(): (path: `/${string}`) => Href {
  const prefix = useLocalePathPrefix();
  // Typed routes can't express a runtime-joined string; every path fed
  // here is a literal route that exists in both trees (see `app/en/`).
  return (path) => (prefix ? (`${prefix}${path}` as Href) : (path as Href));
}

/**
 * The `/en` twin of the current public page, when the visitor should
 * be there instead — or null when the address already matches.
 */
export function useEnglishTwinRedirect(): Href | null {
  const { locale, hydrated } = useI18n();
  const pathname = usePathname();
  if (Platform.OS !== "web" || !hydrated) return null;
  if (locale !== "en" || pathname.startsWith("/en")) return null;
  const search = typeof window !== "undefined" ? window.location.search : "";
  return `/en${pathname === "/" ? "" : pathname}${search}` as Href;
}
