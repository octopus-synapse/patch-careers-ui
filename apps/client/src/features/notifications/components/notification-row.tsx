/**
 * One inbox row: avatar (or type icon when the notification has no actor) ·
 * pre-rendered message · time, with an unread dot + bolder text when unread.
 * Tapping marks it read and deep-links to the related entity. Composed from
 * `@patch-careers/ui` primitives; press feedback uses the warm-paper tint.
 */

import { Avatar, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { iconForType } from "../lib/notification-presentation";
import { timeAgo } from "../lib/time-ago";
import type { NotificationItem } from "../types";

function LeadingGlyph({ item }: { item: NotificationItem }): ReactElement {
  const palette = useEditorialPalette();
  const actorName = item.actor?.name ?? item.actor?.username ?? "";
  if (item.actor?.photoURL || actorName) {
    return <Avatar src={item.actor?.photoURL ?? undefined} name={actorName} size="md" />;
  }
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.hairline,
      }}
    >
      <Icon as={iconForType(item.type)} size={20} color={palette.muted} />
    </View>
  );
}

export function NotificationRow({
  item,
  now,
  onPress,
}: {
  item: NotificationItem;
  now: number;
  onPress: (item: NotificationItem) => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const unread = !item.read;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("notifications.inbox.rowLabel", { message: item.message })}
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.bg : unread ? palette.surface : palette.bg,
      })}
    >
      <XStack alignItems="center" gap={12} paddingHorizontal={20} paddingVertical={14}>
        <LeadingGlyph item={item} />
        <YStack flex={1} gap={3}>
          <Text
            preset="body"
            numberOfLines={2}
            color={unread ? palette.ink : palette.body}
            fontWeight={unread ? "600" : "400"}
          >
            {item.message}
          </Text>
          <Text preset="caption" fontSize={11} color={palette.subtle}>
            {timeAgo(item.createdAt, now, t)}
          </Text>
        </YStack>
        {unread ? (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent }} />
        ) : null}
      </XStack>
    </Pressable>
  );
}
