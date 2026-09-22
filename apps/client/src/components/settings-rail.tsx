import { useAppRouter } from "@/navigation/use-app-router";
/**
 * `SettingsRail` — the left column of desktop settings: serif masthead, the
 * four sections, a hairline, and sign-out.
 *
 * It is a marker, not a menu. On the single page it names the section you are
 * reading and scrolling moves it on its own; on a drill-down pane (change
 * e-mail, 2FA, blocked…) it names the section that pane belongs to. Either way
 * the caller owns what "active" means and what a click does — this file only
 * knows how a rail looks.
 *
 * And it looks like the rest of the chrome: a row is a PILL that fills with the
 * brand indigo (red on sign-out) when it is active or under the pointer, its
 * label inverted on top, its glyph riding a disc that flips from a hairline
 * ring to a white circle carrying the fill colour. The same move the navbar's
 * circular controls and the menu's rows make — one gesture everywhere, so a
 * filled shape always means "this is the one".
 *
 * App-local rather than `@patch-careers/ui` because it owns sign-out, which is
 * coupled to the auth client and expo-router (ARCHITECTURE.md §3.1). It sits
 * beside `settings-screen-shell.tsx`, its other consumer.
 */

import { logout } from "@patch-careers/auth";
import { navFilled } from "@patch-careers/tokens";
import { Divider, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";

import { LogOut } from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";
import { useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "@/features/settings";
import { AUTH_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";

// Rail geometry from the approved desktop settings design: 232px column, one
// wide gutter to the pane beside it. The row grew from 40 to seat the disc.
export const RAIL_WIDTH = 232;
export const RAIL_GAP = 40;

const DISC = 32;
const GLYPH = 17;
const ROW_HEIGHT = 48;

/** Fills its relative parent — the row's fill, the disc's ring and lift layer. */
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
const CENTERED = { position: "absolute" } as const;

/** The reference's `duration-300 ease-silk`, in both directions. */
const TIMING = { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const INSTANT = { duration: 0, easing: Easing.linear };

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

export function SettingsRail({
  activeId,
  onSelect,
}: {
  readonly activeId: SettingsSectionId | null;
  readonly onSelect: (id: SettingsSectionId) => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const router = useAppRouter();
  const { t } = useI18n();

  async function signOut(): Promise<void> {
    await logout();
    router.replace(AUTH_ROUTE);
  }

  return (
    <YStack width={RAIL_WIDTH}>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={26}
        lineHeight={34}
        color={palette.ink}
        paddingHorizontal={12}
      >
        {t("settings.title")}
      </Text>

      <YStack marginTop={24} gap={2}>
        {SETTINGS_SECTIONS.map((section) => (
          <RailItem
            key={section.id}
            icon={section.icon}
            label={t(section.labelKey)}
            active={section.id === activeId}
            onPress={() => onSelect(section.id)}
          />
        ))}
      </YStack>

      <YStack marginVertical={16} marginHorizontal={12}>
        <Divider color={palette.hairline} />
      </YStack>

      <RailItem icon={LogOut} label={t("settings.signOut")} danger onPress={() => void signOut()} />
    </YStack>
  );
}

function RailItem({
  icon: Glyph,
  label,
  active = false,
  danger = false,
  onPress,
}: {
  icon: ComponentType<GlyphProps>;
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const filled = navFilled[useThemeName()];
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const fill = danger ? filled.danger : filled.accent;
  // Active is the same state as hover, held — the reference's `active ? on : …`.
  const on = active || hovered ? 1 : 0;
  const timing = reduceMotion ? INSTANT : TIMING;

  const fillStyle = useAnimatedStyle(() => ({ opacity: withTiming(on, timing) }), [on, timing]);
  const restStyle = useAnimatedStyle(() => ({ opacity: withTiming(1 - on, timing) }), [on, timing]);

  const restColor = danger ? palette.danger : palette.body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <XStack
        alignItems="center"
        gap={12}
        height={ROW_HEIGHT}
        paddingLeft={8}
        paddingRight={16}
        borderRadius={999}
        // Opens a stacking context so the fill's negative z-index stays trapped
        // inside this row instead of sliding behind the whole rail.
        zIndex={0}
      >
        <Animated.View
          pointerEvents="none"
          style={[FILL, { zIndex: -1, borderRadius: 999, backgroundColor: fill }, fillStyle]}
        />

        <YStack width={DISC} height={DISC} alignItems="center" justifyContent="center">
          <YStack {...FILL} borderRadius={999} borderWidth={1} borderColor={palette.hairline} />
          {/* An opaque disc fading in OVER the ring — how the reference hides
              the border without animating a colour. */}
          <Animated.View
            pointerEvents="none"
            style={[FILL, { borderRadius: DISC / 2, backgroundColor: palette.panel }, fillStyle]}
          />
          <Animated.View pointerEvents="none" style={[CENTERED, restStyle]}>
            <Glyph size={GLYPH} color={restColor} strokeWidth={1.75} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[CENTERED, fillStyle]}>
            <Glyph size={GLYPH} color={fill} strokeWidth={2} />
          </Animated.View>
        </YStack>

        <Text
          flex={1}
          fontFamily={editorialFonts.sans}
          fontSize={13.5}
          fontWeight={on === 1 ? "600" : "400"}
          color={on === 1 ? filled.onFill : restColor}
          numberOfLines={1}
        >
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}
