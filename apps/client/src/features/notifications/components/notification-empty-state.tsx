/**
 * Empty + error states for the notification inbox, built from the shared
 * `EmptyState` compound (same pattern as the Messages inbox).
 */

import { EmptyState, Icon, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Bell, BellOff } from "lucide-react-native";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";

export function NotificationEmptyState(): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <YStack flex={1} justifyContent="center">
      <EmptyState
        icon={<Icon as={Bell} size={32} color={palette.subtle} />}
        title={t("notifications.inbox.emptyTitle")}
        description={t("notifications.inbox.emptyDescription")}
      />
    </YStack>
  );
}

export function NotificationErrorState({ onRetry }: { onRetry: () => void }): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <YStack flex={1} justifyContent="center">
      <EmptyState
        icon={<Icon as={BellOff} size={32} color={palette.subtle} />}
        title={t("notifications.inbox.errorTitle")}
        description={t("notifications.inbox.errorDescription")}
        ctaLabel={t("common.retry")}
        onCta={onRetry}
      />
    </YStack>
  );
}
