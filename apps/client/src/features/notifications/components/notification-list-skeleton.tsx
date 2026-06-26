/**
 * Loading placeholder for the inbox — avatar + two-line rows built from the
 * shared `Skeleton` primitive (mirrors the Messages inbox skeleton).
 */

import { Skeleton, XStack, YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";

const ROW_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7"] as const;

function SkeletonRow(): ReactElement {
  return (
    <XStack alignItems="center" gap={12} paddingHorizontal={20} paddingVertical={14}>
      <Skeleton variant="avatar" />
      <YStack flex={1} gap={8}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="35%" />
      </YStack>
    </XStack>
  );
}

export function NotificationListSkeleton({ rows = 7 }: { rows?: number }): ReactElement {
  return (
    <YStack>
      {ROW_KEYS.slice(0, rows).map((key) => (
        <SkeletonRow key={key} />
      ))}
    </YStack>
  );
}
