/**
 * SearchTrigger — the header's non-editable search pill. Visually a pill but
 * it's a button: tapping it opens the centered SearchModal command palette,
 * where the real input lives.
 *
 * Three bases, two signals:
 *   • default — surface pill on the mobile AppHeader.
 *   • `collapsed` — the Vagas header collapsed to just the search on scroll
 *     down. Adopts the "V5" treatment: a bigger, lighter search glyph, a taller
 *     near-transparent pill and a quieter placeholder, so the icon carries the
 *     emphasis while the field melts into the (now transparent) header.
 *   • `inset` — the desktop-web navbar base: the same glass wash the bar's
 *     circular controls wear, an accent magnifier at a heavier stroke, and a
 *     trailing ⌘K. Hover lifts the wash and the hairline.
 *   • `active` — the search is engaged (modal open) or the pill is pressed.
 *     Adopts the "V3" treatment: an accent focus ring + accent glyph. Applies
 *     over EVERY base.
 */

import { editorialOverlays } from "@patch-careers/tokens";
import { Icon, Text, XStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { Search } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function SearchTrigger({
  onPress,
  collapsed = false,
  inset = false,
  active = false,
}: {
  onPress: () => void;
  /** Vagas header collapsed to just the search (scroll down) → "V5" base. */
  collapsed?: boolean;
  /** Desktop-web navbar base: glass wash + accent magnifier + ⌘K hint. */
  inset?: boolean;
  /** Search engaged (modal open) → "V3" accent focus ring. */
  active?: boolean;
}): ReactElement {
  const { t } = useI18n();
  const editorialPalette = useEditorialPalette();
  const overlays = editorialOverlays[useThemeName()];
  // Pointer feedback for the inset (navbar) base — never fires on touch.
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("search.openA11y")}
      accessibilityState={{ expanded: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {({ pressed }) => {
        // V3 ring whenever the field is engaged or pressed — over any base.
        const focused = active || pressed;
        // The inset base draws its own accent magnifier, so this ramp only
        // serves the mobile bases.
        const iconColor = focused
          ? editorialPalette.accent
          : collapsed
            ? // V5: bigger + lighter (ink at ~80% alpha).
              `${editorialPalette.ink}CC`
            : editorialPalette.subtle;

        if (inset) {
          return (
            <XStack
              alignItems="center"
              gap={10}
              height={42}
              paddingHorizontal={18}
              borderRadius={21}
              borderWidth={focused ? 2 : 1}
              borderColor={
                focused
                  ? `${editorialPalette.accent}4D`
                  : hovered
                    ? editorialPalette.hairlineStrong
                    : editorialPalette.hairline
              }
              // The same glass the bell and the hamburger wear — the three
              // controls read as one material riding the bar.
              backgroundColor={hovered ? overlays.navGlassHover : overlays.navGlass}
            >
              {/* The one spot of colour in the row: the magnifier carries the
                  accent at a heavier weight, so the field reads as the bar's
                  active affordance without a fill or a shadow. */}
              <Icon as={Search} size={15} color={editorialPalette.accent} strokeWidth={2.5} />
              <Text
                flex={1}
                fontFamily={editorialFonts.sans}
                fontSize={14}
                color={hovered || focused ? editorialPalette.ink : editorialPalette.body}
                numberOfLines={1}
              >
                {t("search.navPlaceholder")}
              </Text>
              {/* The bar is wide enough to advertise the shortcut that opens
                  the same palette from anywhere. */}
              <Text
                fontFamily={editorialFonts.mono}
                fontSize={11}
                letterSpacing={0.55}
                color={editorialPalette.subtle}
              >
                {t("search.shortcutKbd")}
              </Text>
            </XStack>
          );
        }

        return (
          <XStack
            alignItems="center"
            gap={collapsed ? 10 : 7}
            height={collapsed ? 46 : 38}
            paddingHorizontal={collapsed ? 16 : 12}
            borderRadius={collapsed ? 23 : 19}
            borderWidth={focused ? 2 : 1}
            borderColor={
              focused
                ? // V3 ring: accent at ~30% alpha.
                  `${editorialPalette.accent}4D`
                : collapsed
                  ? `${editorialPalette.hairlineStrong}B3`
                  : editorialPalette.hairline
            }
            backgroundColor={
              collapsed
                ? // V5: near-transparent surface so it floats over the header.
                  `${editorialPalette.surface}66`
                : pressed
                  ? editorialPalette.bg
                  : editorialPalette.surface
            }
          >
            <Icon as={Search} size={collapsed ? 26 : 16} color={iconColor} />
            <Text
              preset="label"
              fontSize={collapsed ? 15 : 14}
              color={collapsed ? editorialPalette.muted : editorialPalette.subtle}
            >
              {t("search.placeholder")}
            </Text>
          </XStack>
        );
      }}
    </Pressable>
  );
}
