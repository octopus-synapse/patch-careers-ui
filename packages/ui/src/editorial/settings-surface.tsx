/**
 * `SettingsCard` + `SettingsRow` — the Editorial Calm surface + navigable row
 * used by the settings screens and the Profile tab. Promoted out of the
 * settings feature (rule of three: 2+ feature consumers) so it can be shared
 * without a cross-feature import (ADR-0010). Matches the `EditableRow` idiom.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { ChevronRight } from "lucide-react-native";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorialPaletteFor } from "../internal/editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts as fonts } from "./fonts";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

/** Rounded surface that groups a list of `SettingsRow`s. */
export function SettingsCard({ children }: { children: ReactNode }): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  return <View style={styles.card}>{children}</View>;
}

/** Navigable row: leading icon · label · optional trailing value/badge · chevron. */
export function SettingsRow({
  icon: RowIcon,
  label,
  value,
  badge,
  onPress,
  first = false,
  danger = false,
}: {
  icon: Glyph;
  label: string;
  value?: string | undefined;
  badge?: string | undefined;
  onPress: () => void;
  first?: boolean;
  danger?: boolean;
}): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const palette = editorialPaletteFor(useThemeName());
  const tint = danger ? palette.danger : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        first ? null : styles.rowDivider,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <RowIcon size={20} color={danger ? palette.danger : palette.body} strokeWidth={1.75} />
      <Text style={[styles.rowLabel, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
      {badge ? <Text style={styles.rowBadge}>{badge}</Text> : null}
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {danger ? null : <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />}
    </Pressable>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: p.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.hairline,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: p.hairline },
    rowPressed: { backgroundColor: p.bg },
    rowLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 15.5, color: p.ink },
    rowValue: { fontFamily: fonts.sans, fontSize: 14, color: p.muted },
    rowBadge: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: p.warn },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
