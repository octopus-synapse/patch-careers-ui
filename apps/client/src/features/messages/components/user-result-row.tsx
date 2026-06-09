/**
 * One people-search result. Tapping it opens (or starts) a conversation with
 * that user.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Avatar, Text, XStack, YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { participantLabel } from "../lib/helpers";
import type { ChatUser } from "../types";

export function UserResultRow({
  user,
  onPress,
}: {
  user: ChatUser;
  onPress: (user: ChatUser) => void;
}): ReactElement {
  const name = participantLabel(user);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversar com ${name}`}
      onPress={() => onPress(user)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? editorialPalette.bg : editorialPalette.surface,
      })}
    >
      <XStack alignItems="center" gap={12} paddingHorizontal={20} paddingVertical={12}>
        <Avatar src={user.photoURL ?? undefined} name={name} size="sm" />
        <YStack flex={1}>
          <Text preset="label" numberOfLines={1} color={editorialPalette.ink} fontWeight="600">
            {name}
          </Text>
          {user.username ? (
            <Text preset="caption" fontSize={11} color={editorialPalette.subtle}>
              @{user.username}
            </Text>
          ) : null}
        </YStack>
      </XStack>
    </Pressable>
  );
}
