/**
 * The default Stack scene `contentStyle`: paper-colored background
 * everywhere (so push transitions don't flash white on dark), centered
 * into the desktop content column on desktop web. Shared by the root
 * layout and the `/en` tree's layout so scenes in both trees behave
 * identically — and so a screen's full-bleed opt-out (the landing)
 * works the same way in either tree.
 */

import { useEditorialPalette } from "@patch-careers/ui";
import { useMemo } from "react";
import { DESKTOP_CONTENT_MAX_WIDTH, useIsDesktopWeb } from "./use-desktop-web";

interface SceneContentStyle {
  readonly backgroundColor: string;
  readonly width?: "100%";
  readonly maxWidth?: number;
  readonly alignSelf?: "center";
}

export function useSceneContentStyle(): SceneContentStyle {
  const palette = useEditorialPalette();
  const isDesktopWeb = useIsDesktopWeb();
  return useMemo(
    () =>
      isDesktopWeb
        ? {
            backgroundColor: palette.bg,
            width: "100%" as const,
            maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
            alignSelf: "center" as const,
          }
        : { backgroundColor: palette.bg },
    [isDesktopWeb, palette],
  );
}
