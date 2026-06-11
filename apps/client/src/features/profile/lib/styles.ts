/** Editorial Calm styles for the Profile tab (paper bg, serif headings, hairlines). */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const pfFor = (p: EditorialPalette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 22, paddingBottom: 48, gap: 26 },
    centered: { alignItems: "center", justifyContent: "center" },

    // header
    header: { alignItems: "center", gap: 12, paddingTop: 20 },
    avatarWrap: { position: "relative" },
    avatarBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: p.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: p.bg,
    },
    name: {
      fontFamily: fonts.serif,
      fontSize: 27,
      lineHeight: 33,
      color: p.ink,
      textAlign: "center",
    },
    headline: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      lineHeight: 20,
      color: p.body,
      textAlign: "center",
    },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    location: { fontFamily: fonts.sans, fontSize: 13, color: p.muted },
    headlinePlaceholder: { color: p.subtle, fontStyle: "italic" },

    // edit-sheet triggers under the header ("Editar perfil · Sobre · Links")
    editTriggers: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
    editTriggerWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
    editTriggerDot: { fontFamily: fonts.sans, fontSize: 12, color: p.subtle },
    editLink: {
      fontFamily: fonts.sans,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: p.accent,
    },

    // "Perfil" sub-tab body
    masterTab: { gap: 26 },

    // cv button
    cvButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: p.primary,
      borderRadius: 14,
      backgroundColor: p.surface,
      paddingVertical: 15,
    },
    cvButtonLabel: {
      fontFamily: fonts.sans,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.4,
      color: p.ink,
    },

    // edit sheets
    sheetBody: { gap: 22, paddingBottom: 8 },
    sheetActions: { marginTop: 6 },

    // generic states
    noResume: {
      fontFamily: fonts.sans,
      fontSize: 13.5,
      lineHeight: 20,
      color: p.muted,
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const pfByTheme = {
  light: pfFor(editorialPalette),
  dark: pfFor(editorialPaletteDark),
} as const;

/** Theme-aware accessor for the Profile tab stylesheet. */
export function usePf(): (typeof pfByTheme)["light"] {
  return pfByTheme[useThemeName()];
}
