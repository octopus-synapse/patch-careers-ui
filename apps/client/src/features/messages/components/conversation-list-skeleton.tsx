/**
 * Loading placeholder for the inbox — a handful of avatar + two-line rows
 * built from the `@patch-careers/ui` Skeleton primitive.
 */

import { Skeleton, XStack, YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";

// Stable keys so the placeholder rows don't lean on array indices.
const ROW_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"] as const;

function SkeletonRow(): ReactElement {
  return (
    <XStack alignItems="center" gap={12} paddingHorizontal={20} paddingVertical={14}>
      <Skeleton variant="avatar" />
      <YStack flex={1} gap={8}>
        <Skeleton variant="text" width="45%" />
        <Skeleton variant="text" width="80%" />
      </YStack>
    </XStack>
  );
}

export function ConversationListSkeleton({ rows = 7 }: { rows?: number }): ReactElement {
  return (
    <YStack>
      {ROW_KEYS.slice(0, rows).map((key) => (
        <SkeletonRow key={key} />
      ))}
    </YStack>
  );
}
