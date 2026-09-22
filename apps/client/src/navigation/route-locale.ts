import type { Locale } from "@patch-careers/i18n";
import type { Href } from "expo-router";

export const GUEST_LOCALE_CHOICE_KEY = "patch-careers:guest-locale-choice";

export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pt-BR";
}

export function withoutLocale(pathname: string): string {
  if (pathname === "/en") return "/";
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

export function pathForLocale(pathname: string, locale: Locale): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return pathname;
  const bare = withoutLocale(pathname);
  return locale === "en" ? `/en${bare === "/" ? "" : bare}` : bare;
}

export function hrefForLocale(href: Href, locale: Locale): Href {
  if (typeof href === "string") {
    const match = /^([^?#]*)(.*)$/.exec(href);
    return (pathForLocale(match?.[1] ?? href, locale) + (match?.[2] ?? "")) as Href;
  }
  return { ...href, pathname: pathForLocale(href.pathname, locale) } as Href;
}
