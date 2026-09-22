import { Link, type LinkProps, usePathname } from "expo-router";
import type { ReactElement } from "react";
import { Platform } from "react-native";
import { hrefForLocale, localeFromPath } from "./route-locale";

export function AppLink(props: LinkProps): ReactElement {
  const pathname = usePathname();
  const href =
    Platform.OS === "web" ? hrefForLocale(props.href, localeFromPath(pathname)) : props.href;
  return <Link {...props} href={href} />;
}
