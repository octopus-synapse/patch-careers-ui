/**
 * A single chat bubble. Own messages sit right with a soft accent tint and a
 * read receipt; incoming messages sit left in white with a hairline border and
 * the sender avatar on the last bubble of each run.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Avatar, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { Check, CheckCheck } from "lucide-react-native";
import type { ReactElement } from "react";
import { formatTime, type RenderedMessage } from "../lib/helpers";
import { chatColors } from "../lib/theme";

export function MessageBubble({ item }: { item: RenderedMessage }): ReactElement {
  const { message, own, startsGroup, showAvatar } = item;

  return (
    <XStack
      justifyContent={own ? "flex-end" : "flex-start"}
      marginTop={startsGroup ? 12 : 2}
      paddingHorizontal={16}
      gap={8}
    >
      {own ? null : (
        <YStack width={28} justifyContent="flex-end">
          {showAvatar ? (
            <Avatar
              src={message.sender.photoURL ?? undefined}
              name={message.sender.name ?? "?"}
              size="sm"
            />
          ) : null}
        </YStack>
      )}

      <YStack maxWidth="78%" alignItems={own ? "flex-end" : "flex-start"} gap={3}>
        <YStack
          backgroundColor={own ? chatColors.ownBubble : chatColors.otherBubble}
          borderColor={own ? "transparent" : editorialPalette.hairline}
          borderWidth={own ? 0 : 1}
          borderRadius={18}
          borderBottomRightRadius={own ? 4 : 18}
          borderBottomLeftRadius={own ? 18 : 4}
          paddingHorizontal={14}
          paddingVertical={9}
        >
          <Text
            preset="body"
            fontSize={14}
            lineHeight={20}
            color={own ? chatColors.ownText : chatColors.otherText}
          >
            {message.content}
          </Text>
        </YStack>

        <XStack alignItems="center" gap={4} paddingHorizontal={4}>
          <Text preset="caption" fontSize={10} color={editorialPalette.subtle}>
            {formatTime(message.createdAt)}
          </Text>
          {own ? (
            <Icon
              as={message.isRead ? CheckCheck : Check}
              size={13}
              color={message.isRead ? chatColors.tickRead : chatColors.tickSent}
              accessibilityLabel={message.isRead ? "Lida" : "Enviada"}
            />
          ) : null}
        </XStack>
      </YStack>
    </XStack>
  );
}
