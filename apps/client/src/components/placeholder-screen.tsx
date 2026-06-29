/**
 * Generic placeholder screen used by every tab in PR #6.
 * Real per-tab screens land in PR #9-#18.
 */

import { Text, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";

interface Props {
  readonly title: string;
}

export function PlaceholderScreen({ title }: Props): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor={palette.bg}
      padding={24}
    >
      <Text fontSize={24} fontWeight="600" color={palette.ink} marginBottom={8}>
        {title}
      </Text>
      <Text fontSize={14} color={palette.muted}>
        {t("app.placeholderScreen.subtitle")}
      </Text>
    </YStack>
  );
}
