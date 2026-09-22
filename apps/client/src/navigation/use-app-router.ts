import { type Href, usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { Platform } from "react-native";
import { hrefForLocale, localeFromPath } from "./route-locale";

/** Keep every internal web navigation in the current language tree. */
export function useAppRouter(): ReturnType<typeof useRouter> {
  const router = useRouter();
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  return useMemo(() => {
    const localize = (href: Href): Href =>
      Platform.OS === "web" ? hrefForLocale(href, locale) : href;
    return {
      ...router,
      push: (href: Href, options?: Parameters<typeof router.push>[1]) =>
        router.push(localize(href), options),
      replace: (href: Href, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(localize(href), options),
      navigate: (href: Href, options?: Parameters<typeof router.navigate>[1]) =>
        router.navigate(localize(href), options),
      dismissTo: (href: Href, options?: Parameters<typeof router.dismissTo>[1]) =>
        router.dismissTo(localize(href), options),
      prefetch: (href: Href) => router.prefetch(localize(href)),
    };
  }, [router, locale]);
}
