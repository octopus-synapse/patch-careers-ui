/** Editorial Calm styles for the public profile page (`/u/[username]`). */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const ppFor = (p: EditorialPalette) =>
  // @style-allow stylesheet: themed editorial style factory, the pattern every feature here uses
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 22, paddingBottom: 64, alignItems: "center" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
    // One column, centred. There is no rail here: a visitor has no controls,
    // only something to read.
    column: { width: "100%", maxWidth: 680, gap: 24 },

    card: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 20,
      backgroundColor: p.panel,
      paddingHorizontal: 32,
      paddingVertical: 32,
      gap: 20,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 22 },
    headBody: { flex: 1, minWidth: 0, gap: 6 },
    name: {
      fontFamily: fonts.serif,
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: p.ink,
    },
    headline: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: p.body },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    meta: { fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.2, color: p.muted },
    handle: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.3, color: p.subtle },

    rule: { height: 1, backgroundColor: p.hairline },
    bio: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 23, color: p.body },

    linkList: { gap: 2 },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    linkRowLast: { borderBottomWidth: 0 },
    linkLabel: { width: 92, fontFamily: fonts.sans, fontSize: 12.5, color: p.muted },
    linkUrl: { flex: 1, fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 18, color: p.ink },
    linkUrlActive: { color: p.accent },

    smallcaps: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      fontWeight: "500",
      letterSpacing: 1.7,
      textTransform: "uppercase",
      color: p.subtle,
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const ppByTheme = {
  light: ppFor(editorialPalette),
  dark: ppFor(editorialPaletteDark),
} as const;

export function usePp(): (typeof ppByTheme)["light"] {
  return ppByTheme[useThemeName()];
}
