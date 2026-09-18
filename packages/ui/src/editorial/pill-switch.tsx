/** Compact two-or-more option switch used by editorial cards. */
import type { EditorialPalette } from "@patch-careers/tokens";
import { editorialPalette, editorialPaletteDark } from "@patch-careers/tokens";
import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts as fonts } from "./fonts";

export type PillSwitchOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly accessibilityLabel?: string;
};

export function PillSwitch<T extends string>({
  value,
  options,
  onChange,
}: {
  readonly value: T;
  readonly options: ReadonlyArray<PillSwitchOption<T>>;
  readonly onChange: (value: T) => void;
}): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const [hovered, setHovered] = useState<T | null>(null);

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onPress={() => onChange(option.value)}
            onHoverIn={() => setHovered(option.value)}
            onHoverOut={() => setHovered(null)}
            style={[
              styles.pill,
              active && styles.pillActive,
              !active && hovered === option.value && styles.pillHover,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    pill: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 999,
      backgroundColor: p.surface,
      paddingHorizontal: 16,
      paddingVertical: 7,
    },
    pillActive: { borderColor: p.ink, backgroundColor: p.ink },
    pillHover: { borderColor: p.hairlineStrong },
    label: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "500", color: p.ink },
    labelActive: { color: p.bg },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
