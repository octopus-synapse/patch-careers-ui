/**
 * `NavTabItem` — one destination column of the app bar: a glyph over a
 * sentence-case label, hover lifting muted → ink, and the active state carrying
 * ink + a filled glyph + a 2px underline that stops short of the column's edges
 * so it reads as underlining the label rather than dividing the bar.
 *
 * Local to the web bar on purpose — the mobile bottom bar keeps the shared
 * small-caps `TabBarItem` untouched.
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, type ReactNode, useState } from "react";
import { Pressable } from "react-native";
import { NAV_BAR_HEIGHT_APP, NAV_ITEM_WIDTH } from "./nav-bar.contract";

export function NavTabItem({
  label,
  focused,
  onPress,
  renderIcon,
  badge,
  accessibilityLabel,
}: {
  readonly label: string;
  readonly focused: boolean;
  readonly onPress: () => void;
  readonly renderIcon: (args: { focused: boolean; color: string; size: number }) => ReactNode;
  readonly badge?: ReactNode;
  readonly accessibilityLabel?: string;
}): ReactElement {
  const palette = useEditorialPalette();
  const [hovered, setHovered] = useState(false);
  const color = focused || hovered ? palette.ink : palette.muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <YStack
        width={NAV_ITEM_WIDTH}
        height={NAV_BAR_HEIGHT_APP}
        alignItems="center"
        justifyContent="center"
        gap={6}
      >
        {/* Fixed-height glyph band so an avatar glyph never shifts baselines;
            a tight relative wrapper anchors the corner badge. */}
        <YStack height={24} alignItems="center" justifyContent="center">
          <YStack position="relative">
            {renderIcon({ focused, color, size: 22 })}
            {badge}
          </YStack>
        </YStack>
        <XStack alignItems="center">
          <Text
            fontSize={12.5}
            lineHeight={15}
            fontWeight={focused ? "600" : "400"}
            color={color}
            numberOfLines={1}
          >
            {label}
          </Text>
        </XStack>
        <YStack
          position="absolute"
          bottom={14}
          left={17}
          right={17}
          height={2}
          borderRadius={2}
          backgroundColor={palette.ink}
          opacity={focused ? 1 : 0}
        />
      </YStack>
    </Pressable>
  );
}
