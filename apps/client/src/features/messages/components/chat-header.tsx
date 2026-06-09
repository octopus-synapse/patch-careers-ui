/**
 * Thread header — back affordance, participant avatar and name/@username.
 * Mirrors the reference web header but in the native push-navigation idiom
 * (the bottom tab bar is hidden while a thread is open).
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Avatar, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { ChevronLeft } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable } from "react-native";

export function ChatHeader({
  name,
  username,
  photoURL,
  onBack,
}: {
  name: string;
  username?: string | undefined;
  photoURL?: string | undefined;
  onBack: () => void;
}): ReactElement {
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
        accessibilityLabel="Voltar"
        onPress={onBack}
        hitSlop={8}
        style={{ padding: 4 }}
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
    </XStack>
  );
}
