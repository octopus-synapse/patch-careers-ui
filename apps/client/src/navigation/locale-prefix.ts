/** Web URL helpers. Every internal route has a generated English alias. */

import { type Href, usePathname } from "expo-router";
import { Platform } from "react-native";
import { hrefForLocale, localeFromPath } from "./route-locale";

export function useLocalePathPrefix(): "" | "/en" {
  const locale = localeFromPath(usePathname());
  if (Platform.OS !== "web") return "";
  return locale === "en" ? "/en" : "";
}

/** Prefix any internal path with the current web locale. */
export function useLocalizedHref(): (path: `/${string}`) => Href {
  const locale = localeFromPath(usePathname());
  return (path) => (Platform.OS === "web" ? hrefForLocale(path as Href, locale) : (path as Href));
}
