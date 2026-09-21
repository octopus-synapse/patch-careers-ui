/**
 * Compatibility redirect for app URLs that were incorrectly locale-prefixed.
 * Concrete public English routes win over this catch-all; anything left under
 * `/en/*` belongs to the signed-in app and is canonical without the prefix.
 */

import { type Href, Redirect, usePathname } from "expo-router";
import type { ReactElement } from "react";

export default function EnglishAppRedirect(): ReactElement {
  const pathname = usePathname();
  const bare = pathname.startsWith("/en/") ? pathname.slice(3) : "/";
  const search = typeof window === "undefined" ? "" : window.location.search;
  return <Redirect href={`${bare}${search}` as Href} />;
}
