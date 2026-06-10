/**
 * Web-only HTML shell (Expo Router). Two jobs:
 *
 * 1. `<meta name="color-scheme">` tells the browser both schemes are
 *    supported, so UA surfaces (scrollbars, native inputs) can follow.
 * 2. The inline script applies the persisted theme choice synchronously,
 *    BEFORE first paint — without it an explicit "dark" choice flashes a
 *    light frame while React hydrates. It reads the zustand-persist envelope
 *    the color-scheme store writes to localStorage and resolves "system" via
 *    `prefers-color-scheme`. The background hexes mirror
 *    `editorialPalettes.{light,dark}.bg` (kept literal — this script must not
 *    import anything).
 */

import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren, ReactElement } from "react";

const themeBootstrap = `
(function () {
  try {
    var scheme = "system";
    var raw = window.localStorage.getItem("patch-careers:color-scheme");
    if (raw) {
      var parsed = JSON.parse(raw);
      var stored = parsed && parsed.state && parsed.state.scheme;
      if (stored === "light" || stored === "dark" || stored === "system") scheme = stored;
    }
    var dark = scheme === "dark" ||
      (scheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.style.colorScheme = dark ? "dark" : "light";
    root.style.backgroundColor = dark ? "#161512" : "#FAFAF6";
  } catch (e) {}
})();
`;

export default function Root({ children }: PropsWithChildren): ReactElement {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="color-scheme" content="light dark" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint theme bootstrap must run inline */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
