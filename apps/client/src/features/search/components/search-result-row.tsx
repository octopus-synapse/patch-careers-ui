/**
 * SearchResultRow — one tappable line in the search modal, shared by live
 * results, persisted recents (trailing remove ✕) and the Explorar shortcuts
 * (leading icon chip). Ported from the old header dropdown's ResultRow.
 */

import { Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";
import { Pressable, View } from "react-native";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

export function SearchResultRow({
  title,
  snippet,
  badge,
  icon: Glyph,
  onPress,
  onRemove,
}: {
  title: string;
  snippet?: string | undefined;
  badge?: string | undefined;
  /** Leading icon, rendered in a hairline chip (recents/Explorar rows). */
  icon?: ComponentType<GlyphProps> | undefined;
  onPress: () => void;
  /** When set, shows a trailing ✕ that removes the row (recents). */
  onRemove?: (() => void) | undefined;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      {({ pressed }) => (
        <XStack
          alignItems="center"
          gap={12}
          paddingHorizontal={16}
          paddingVertical={12}
          backgroundColor={pressed ? editorialPalette.bg : "transparent"}
        >
          {Glyph ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: editorialPalette.hairline,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Glyph size={15} color={editorialPalette.muted} strokeWidth={1.75} />
            </View>
          ) : null}
          <YStack flex={1}>
            <Text preset="label" numberOfLines={1} color={editorialPalette.ink} fontWeight="600">
              {title}
            </Text>
            {snippet ? (
              <Text preset="caption" numberOfLines={1} color={editorialPalette.subtle}>
                {snippet}
              </Text>
            ) : null}
          </YStack>
          {badge ? (
            <Text preset="caption" fontSize={11} color={editorialPalette.accent} fontWeight="600">
              {badge}
            </Text>
          ) : null}
          {onRemove ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover ${title} das buscas recentes`}
              onPress={onRemove}
              hitSlop={10}
            >
              <Icon as={X} size={15} color={editorialPalette.subtle} />
            </Pressable>
          ) : null}
        </XStack>
      )}
    </Pressable>
  );
}
