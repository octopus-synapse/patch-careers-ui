/**
 * Thread header — back affordance, participant avatar and name/@username.
 * Mirrors the reference web header but in the native push-navigation idiom
 * (the bottom tab bar is hidden while a thread is open).
 */

import { Avatar, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Ban, ChevronLeft } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

// Back-button hit padding (kept on the RN Pressable so it composes with hitSlop).
const BACK_BUTTON_PADDING = 4;

export function ChatHeader({
  name,
  username,
  photoURL,
  onBack,
  onBlock,
}: {
  name: string;
  username?: string | undefined;
  photoURL?: string | undefined;
  onBack: () => void;
  /** Omitted when the peer's id is unknown — the action needs it. */
  onBlock?: (() => void) | undefined;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <XStack
      alignItems="center"
      gap={10}
      paddingHorizontal={12}
      paddingVertical={10}
      borderBottomWidth={1}
      borderBottomColor={editorialPalette.hairline}
      backgroundColor={editorialPalette.surface}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={onBack}
        hitSlop={8}
        style={{ padding: BACK_BUTTON_PADDING }}
      >
        <Icon as={ChevronLeft} size={26} color={editorialPalette.ink} />
      </Pressable>

      <Avatar src={photoURL} name={name} size="sm" />

      <YStack flex={1}>
        <Text preset="label" numberOfLines={1} color={editorialPalette.ink} fontWeight="600">
          {name}
        </Text>
        {username ? (
          <Text preset="caption" fontSize={11} color={editorialPalette.subtle}>
            @{username}
          </Text>
        ) : null}
      </YStack>
      {onBlock ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("messages.block.action")}
          onPress={onBlock}
          hitSlop={8}
          style={{ padding: BACK_BUTTON_PADDING }}
        >
          <Icon as={Ban} size={20} color={editorialPalette.subtle} />
        </Pressable>
      ) : null}
    </XStack>
  );
}
