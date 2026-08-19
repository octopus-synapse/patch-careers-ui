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
 *   • `inset` — the desktop-web navbar base: a darker well (paper bg sunk into
 *     the surface bar) with a serif-italic placeholder, so the field reads as
 *     an editorial inset rather than a bordered control. Hover (pointer-only)
 *     lifts the hairline + placeholder.
 *   • `active` — the search is engaged (modal open) or the pill is pressed.
 *     Adopts the "V3" treatment: an accent focus ring + accent glyph. Applies
 *     over EVERY base.
 */

import { Icon, Text, XStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
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
  /** Desktop-web navbar base: darker inset well + serif-italic placeholder. */
  inset?: boolean;
  /** Search engaged (modal open) → "V3" accent focus ring. */
  active?: boolean;
}): ReactElement {
  const { t } = useI18n();
  const editorialPalette = useEditorialPalette();
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
        const iconColor = focused
          ? editorialPalette.accent
          : collapsed
            ? // V5: bigger + lighter (ink at ~80% alpha).
              `${editorialPalette.ink}CC`
            : inset && hovered
              ? editorialPalette.body
              : editorialPalette.subtle;

        if (inset) {
          return (
            <XStack
              alignItems="center"
              gap={9}
              height={38}
              paddingHorizontal={14}
              borderRadius={19}
              borderWidth={focused ? 2 : 1}
              borderColor={
                focused
                  ? `${editorialPalette.accent}4D`
                  : hovered
                    ? editorialPalette.hairlineStrong
                    : editorialPalette.hairline
              }
              // The well: paper sunk into the surface bar, not a raised card.
              backgroundColor={editorialPalette.bg}
            >
              <Icon as={Search} size={15} color={iconColor} />
              <Text
                fontFamily={editorialFonts.serif}
                fontStyle="italic"
                fontSize={13.5}
                color={hovered || focused ? editorialPalette.body : editorialPalette.muted}
              >
                {t("search.placeholder")}
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
