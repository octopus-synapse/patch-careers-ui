/**
 * Loading placeholder for the inbox surfaces (notifications + messages): a few
 * avatar + two-line rows built from the `@patch-careers/ui` Skeleton primitive.
 * Shared so both inboxes stay visually in sync; each passes its own line widths.
 */

import { Skeleton, XStack, YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";

const ROW_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"] as const;

export function InboxListSkeleton({
  rows = 7,
  lineWidths = ["80%", "35%"],
}: {
  rows?: number;
  /** [primary, secondary] placeholder line widths. */
  lineWidths?: readonly [string, string];
}): ReactElement {
  return (
    <YStack>
      {ROW_KEYS.slice(0, rows).map((key) => (
        <XStack key={key} alignItems="center" gap={12} paddingHorizontal={20} paddingVertical={14}>
          <Skeleton variant="avatar" />
          <YStack flex={1} gap={8}>
            <Skeleton variant="text" width={lineWidths[0]} />
            <Skeleton variant="text" width={lineWidths[1]} />
          </YStack>
        </XStack>
      ))}
    </YStack>
  );
}
