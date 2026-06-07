/**
 * One inbox row: avatar · name + last-message preview · time + unread pill.
 * Composed entirely from `@patch-careers/ui` primitives; press feedback uses
 * the same warm-paper tint the rest of the app uses for pressed surfaces.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Avatar, Text, XStack, YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { participantLabel, timeAgo } from "../helpers";
import { chatColors } from "../theme";
import type { Conversation } from "../types";

function UnreadPill({ count }: { count: number }): ReactElement {
  return (
    <XStack
      backgroundColor={chatColors.unread}
      borderRadius={999}
      minWidth={20}
      height={20}
      paddingHorizontal={6}
      alignItems="center"
      justifyContent="center"
    >
      <Text preset="caption" fontSize={11} fontWeight="700" color={editorialPalette.surface}>
        {count > 99 ? "99+" : count}
      </Text>
    </XStack>
  );
}

export function ConversationRow({
  conversation,
  now,
  onPress,
}: {
  conversation: Conversation;
  now: number;
  onPress: (conversation: Conversation) => void;
}): ReactElement {
  const { participant, lastMessage, unreadCount } = conversation;
  const name = participantLabel(participant);
  const unread = unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversa com ${name}`}
      onPress={() => onPress(conversation)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? editorialPalette.bg : editorialPalette.surface,
      })}
    >
      <XStack alignItems="center" gap={12} paddingHorizontal={20} paddingVertical={14}>
        <Avatar src={participant.photoURL ?? undefined} name={name} size="md" />
        <YStack flex={1} gap={3}>
          <XStack alignItems="center" justifyContent="space-between" gap={8}>
            <Text
              preset="label"
              flex={1}
              numberOfLines={1}
              color={editorialPalette.ink}
              fontWeight={unread ? "700" : "600"}
            >
              {name}
            </Text>
            {lastMessage ? (
              <Text preset="caption" fontSize={11} color={editorialPalette.subtle}>
                {timeAgo(lastMessage.createdAt, now)}
              </Text>
            ) : null}
          </XStack>
          <XStack alignItems="center" justifyContent="space-between" gap={8}>
            <Text
              preset="caption"
              flex={1}
              numberOfLines={1}
              color={unread ? editorialPalette.body : editorialPalette.muted}
              fontWeight={unread ? "600" : "400"}
            >
              {lastMessage?.content ?? "Sem mensagens ainda"}
            </Text>
            {unread ? <UnreadPill count={unreadCount} /> : null}
          </XStack>
        </YStack>
      </XStack>
    </Pressable>
  );
}
