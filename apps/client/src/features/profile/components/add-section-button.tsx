/**
 * "Add a section" CTA for the Profile tab — rendered as the SAME frosted-glass
 * material as the inactive Jobs scope tabs ("Todas · Salvas · Candidaturas"),
 * pulling its tint/wash/border/ink straight from the shared
 * `FROSTED_PILL_STATE.inactive` tokens so the two stay in lockstep (DRY).
 *
 * It keeps a CTA footprint (full-width, taller tap target) but otherwise reads
 * exactly like an inactive tab: deep translucent glass, hairline edge, light
 * text, rounded-full pill, soft lifted shadow. Floated over the scroll, the
 * backdrop blur frosts the content passing behind it.
 */
import { Text as UiText, XStack } from "@patch-careers/ui";
import {
  FROSTED_PILL_STATE,
  editorialFonts as fonts,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { BlurView } from "expo-blur";
import { Plus } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const STATE = FROSTED_PILL_STATE.inactive;
const RADIUS = 999;

export function AddSectionButton({
  label,
  onPress,
  disabled = false,
  variant = "frosted",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** "frosted" floats over scrolling content; "ink" is the inline slab for
   * static placements (desktop column) where a backdrop blur has nothing to
   * frost. */
  variant?: "frosted" | "ink";
}): ReactElement {
  if (variant === "ink") {
    return <InkAddButton label={label} onPress={onPress} disabled={disabled} />;
  }
  return (
    // Wrapper carries the (unclipped) drop shadow so the rounding doesn't clip it.
    <View style={[styles.wrap, disabled && styles.wrapDisabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        {/* Clipped frosted surface: backdrop blur of whatever scrolls behind +
            the inactive-tab translucent wash + hairline. */}
        <View style={styles.clip}>
          <BlurView
            tint={STATE.tint}
            intensity={STATE.intensity}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.wash]} />
        </View>
        <Plus size={17} color={STATE.text} strokeWidth={2.25} />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

/** Solid-ink pill, same grammar as the DS's primary CTAs (FitProfileCard). */
function InkAddButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {({ pressed }: { pressed: boolean }): ReactNode => (
        <XStack
          backgroundColor={palette.ink}
          opacity={disabled ? 0.5 : pressed ? 0.85 : 1}
          height={52}
          borderRadius={RADIUS}
          alignItems="center"
          justifyContent="center"
          gap={10}
        >
          <Plus size={17} color={palette.bg} strokeWidth={2.25} />
          <UiText
            fontFamily={fonts.sans}
            fontWeight="600"
            fontSize={14.5}
            letterSpacing={0.2}
            color={palette.bg}
          >
            {label}
          </UiText>
        </XStack>
      )}
    </Pressable>
  );
}

// @style-allow stylesheet: frosted-glass CTA (BlurView + StyleSheet.absoluteFill layering, parity with inactive scope pill)
const styles = StyleSheet.create({
  // Soft lift identical to the inactive frosted pill.
  wrap: {
    borderRadius: RADIUS,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.18)",
  },
  wrapDisabled: { opacity: 0.5 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: RADIUS,
  },
  pressed: { opacity: 0.7 },
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: STATE.border,
    overflow: "hidden",
  },
  // Translucent wash — the same "deep glass" tint the inactive tab uses.
  wash: { backgroundColor: STATE.wash },
  label: {
    fontFamily: fonts.sans,
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.2,
    color: STATE.text,
  },
});
