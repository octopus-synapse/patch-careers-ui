/**
 * Editorial Calm styles for the settings feature, themed via the per-theme
 * factory pattern (mirrors features/sections). `useSet()` returns the styles
 * for the active color scheme.
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    backButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
    title: {
      flex: 1,
      textAlign: "center",
      fontFamily: editorialFonts.serif,
      fontSize: 22,
      color: p.ink,
    },
    scrollBody: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
    sectionHeader: {
      fontFamily: editorialFonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.8,
      color: p.muted,
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: p.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.hairline,
      overflow: "hidden",
    },
    cardInner: { paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: p.hairline },
    rowPressed: { backgroundColor: p.bg },
    rowLabel: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 15.5, color: p.ink },
    rowValue: { fontFamily: editorialFonts.sans, fontSize: 14, color: p.muted },
    rowBadge: {
      fontFamily: editorialFonts.mono,
      fontSize: 10,
      letterSpacing: 0.5,
      color: p.warn,
    },
    // pill selector
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },
    pillSelected: { borderColor: p.ink, backgroundColor: p.bg },
    pillLabel: { fontFamily: editorialFonts.sans, fontSize: 12.5, color: p.muted },
    pillLabelSelected: { color: p.ink, fontWeight: "600" },
    // forms
    fieldLabel: {
      fontFamily: editorialFonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.6,
      color: p.muted,
      marginBottom: 6,
    },
    intro: {
      fontFamily: editorialFonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: p.body,
      marginBottom: 18,
    },
    hint: { fontFamily: editorialFonts.mono, fontSize: 11, color: p.muted, marginTop: 6 },
    // Cooldown explainer + lock callout for the username editor.
    ruleNote: {
      fontFamily: editorialFonts.sans,
      fontSize: 13,
      lineHeight: 19,
      color: p.muted,
      marginTop: -8,
      marginBottom: 18,
    },
    lockNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 4,
    },
    lockNoteText: {
      flex: 1,
      fontFamily: editorialFonts.sans,
      fontSize: 13,
      lineHeight: 18,
      color: p.body,
    },
    errorText: { fontFamily: editorialFonts.mono, fontSize: 11, color: p.danger, marginTop: 6 },
    okText: { fontFamily: editorialFonts.mono, fontSize: 11, color: p.accent, marginTop: 6 },
    fieldBlock: { marginBottom: 18 },
    // toggle row
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    toggleLabel: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 14.5, color: p.ink },
    // generic
    bodyText: { fontFamily: editorialFonts.sans, fontSize: 14, lineHeight: 20, color: p.body },
  });

const byTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;

export function useSet(): (typeof byTheme)["light"] {
  return byTheme[useThemeName()];
}
