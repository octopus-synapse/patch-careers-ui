/**
 * `GlassCircleButton` — the navbar's circular control: the notification bell
 * and the hamburger.
 *
 * A hairline ring over a translucent wash that lifts toward opaque on hover or
 * while its menu is open, so the two controls read as one material sitting ON
 * the bar rather than as two separate buttons. The badge rides outside the
 * glyph's box (the bell's count), which is why the glyph gets its own
 * zero-size relative wrapper.
 */

import { editorialOverlays } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { Pressable } from "react-native";
import { NAV_CONTROL_SIZE } from "./nav-bar.contract";

export function GlassCircleButton({
  children,
  badge,
  onPress,
  accessibilityLabel,
  expanded,
  active = false,
}: {
  readonly children: ReactNode;
  /** Rendered over the glyph without affecting its layout (the unread count). */
  readonly badge?: ReactNode;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  /** Present only on menu triggers — drives `aria-expanded`. */
  readonly expanded?: boolean;
  /** The destination this control leads to is the current one. */
  readonly active?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const overlays = editorialOverlays[useThemeName()];
  const lifted = expanded === true || active;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={expanded === undefined ? { selected: active } : { expanded }}
      onPress={onPress}
    >
      <YStack
        width={NAV_CONTROL_SIZE}
        height={NAV_CONTROL_SIZE}
        borderRadius={999}
        borderWidth={1}
        borderColor={lifted ? palette.hairlineStrong : palette.hairline}
        backgroundColor={lifted ? overlays.navGlassHover : overlays.navGlass}
        hoverStyle={{ backgroundColor: overlays.navGlassHover }}
        alignItems="center"
        justifyContent="center"
      >
        {/* Zero-size anchor: the badge hangs off the glyph's corner without
            nudging it off the button's centre. */}
        <YStack position="relative" alignItems="center" justifyContent="center">
          {children}
          {badge}
        </YStack>
      </YStack>
    </Pressable>
  );
}
