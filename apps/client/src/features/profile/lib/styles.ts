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

    // section scaffold
    section: { gap: 12 },
    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionLabel: {
      fontFamily: fonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: p.muted,
    },
    editLink: {
      fontFamily: fonts.sans,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: p.accent,
    },
    hairline: { height: 1, backgroundColor: p.hairline },

    // card / body text
    card: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 16,
      backgroundColor: p.surface,
      padding: 16,
    },
    bodyText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: p.body },
    placeholder: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: p.subtle },

    // completeness
    completeCard: {
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 16,
      backgroundColor: p.surface,
      padding: 16,
      gap: 12,
    },
    completeHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    completeTitle: { fontFamily: fonts.serif, fontSize: 17, color: p.ink },
    completePct: { fontFamily: fonts.mono, fontSize: 15, fontWeight: "600", color: p.ink },
    completeTrack: { height: 6, borderRadius: 3, backgroundColor: p.hairline, overflow: "hidden" },
    completeFill: { height: "100%", borderRadius: 3, backgroundColor: p.success },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: { fontFamily: fonts.sans, fontSize: 12.5, color: p.body },

    // share row
    shareRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 14,
      backgroundColor: p.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    shareBody: { flex: 1, gap: 2 },
    shareLabel: {
      fontFamily: fonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: p.muted,
    },
    shareUrl: { fontFamily: fonts.mono, fontSize: 13, color: p.ink },

    // social links
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
    },
    linkIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: p.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    linkLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, color: p.ink },
    linkValue: { fontFamily: fonts.sans, fontSize: 13, color: p.muted, maxWidth: 160 },

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

    // cv modal
    cvModalRoot: { flex: 1, backgroundColor: p.bg },
    cvModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
      backgroundColor: p.surface,
    },
    cvModalTitle: { fontFamily: fonts.serif, fontSize: 20, color: p.ink },

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
