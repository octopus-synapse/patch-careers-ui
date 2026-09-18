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
    column: { width: "100%", maxWidth: 1240, gap: 24 },
    bodyWide: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
    mainWide: { flex: 1, minWidth: 0, gap: 16 },
    railWide: { width: 300, gap: 16 },

    card: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 20,
      backgroundColor: p.panel,
      paddingHorizontal: 32,
      paddingVertical: 32,
      gap: 20,
    },
    contentCard: { paddingHorizontal: 36, paddingVertical: 32, gap: 24 },
    railCard: { padding: 20, gap: 14 },
    languageCard: { padding: 20, gap: 18 },
    sectionTitle: {
      fontFamily: fonts.serif,
      fontSize: 17,
      lineHeight: 23,
      letterSpacing: -0.2,
      color: p.ink,
    },
    handle: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.3, color: p.subtle },

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
  });

// Precomputed per theme so style-object identity is stable across renders.
const ppByTheme = {
  light: ppFor(editorialPalette),
  dark: ppFor(editorialPaletteDark),
} as const;

export function usePp(): (typeof ppByTheme)["light"] {
  return ppByTheme[useThemeName()];
}
