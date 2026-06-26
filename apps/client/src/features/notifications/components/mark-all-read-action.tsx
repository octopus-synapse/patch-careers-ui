/**
 * "Mark all as read" — a compact text action shown in the tab header, disabled
 * when there's nothing unread.
 */

import { Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function MarkAllReadAction({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
    >
      <Text preset="caption" fontWeight="600" color={disabled ? palette.subtle : palette.accent}>
        {t("notifications.markAllRead")}
      </Text>
    </Pressable>
  );
}
