/**
 * `SettingsSectionHeading` — a section's serif title and its one-line summary.
 *
 * Shared so the single page and the drill-down panes title themselves the same
 * way: on the page it opens each of the four stacked sections, on a pane it is
 * what `SettingsScreenShell` draws above the content (with a back chevron
 * beside it).
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";

export function SettingsSectionHeading({
  title,
  description,
  leading,
}: {
  readonly title: string;
  readonly description?: string | undefined;
  /** Sits before the title on the same line — the panes' back chevron. */
  readonly leading?: ReactNode;
}): ReactElement {
  const palette = useEditorialPalette();

  return (
    <YStack marginBottom={description ? 24 : 6}>
      <XStack alignItems="center" gap={10}>
        {leading}
        <Text fontFamily={editorialFonts.serif} fontSize={19} lineHeight={26} color={palette.ink}>
          {title}
        </Text>
      </XStack>
      {description ? (
        <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted} marginTop={6}>
          {description}
        </Text>
      ) : null}
    </YStack>
  );
}
