import { Redirect, usePathname } from "expo-router";
import type { ComponentProps, ReactElement } from "react";
import { Platform } from "react-native";
import { hrefForLocale, localeFromPath } from "./route-locale";

export function AppRedirect(props: ComponentProps<typeof Redirect>): ReactElement {
  const pathname = usePathname();
  const href = Platform.OS === "web" ? hrefForLocale(props.href, localeFromPath(pathname)) : props.href;
  return <Redirect {...props} href={href} />;
}
