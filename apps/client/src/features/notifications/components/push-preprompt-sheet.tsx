/**
 * Soft pre-prompt for push permission. Rather than firing the OS prompt
 * unconditionally (a denial is permanent until the user digs into system
 * settings), we explain the value first and only call `requestPermission`
 * when the user taps "Enable". Built on the shared editorial Sheet.
 */

import { Text, YStack } from "@patch-careers/ui";
import { Sheet } from "@patch-careers/ui/compounds";
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function PushPrepromptSheet({
  open,
  onOpenChange,
  onEnable,
  onDismiss,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
  onDismiss: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      presentation="card"
      title={t("notifications.preprompt.title")}
      closeLabel={t("notifications.preprompt.notNow")}
    >
      <YStack gap={20} paddingHorizontal={20} paddingTop={8} paddingBottom={24}>
        <Text preset="body" color={palette.body}>
          {t("notifications.preprompt.body")}
        </Text>
        <PrimaryAction label={t("notifications.preprompt.enable")} onPress={onEnable} />
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onDismiss}>
          <Text preset="caption" textAlign="center" fontWeight="600" color={palette.muted}>
            {t("notifications.preprompt.notNow")}
          </Text>
        </Pressable>
      </YStack>
    </Sheet>
  );
}
