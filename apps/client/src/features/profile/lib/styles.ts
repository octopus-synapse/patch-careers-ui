/** Editorial Calm styles for the Profile tab (paper bg, serif headings, hairlines). */
import {
  type EditorialOverlays,
  type EditorialPalette,
  editorialOverlays,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const pfFor = (p: EditorialPalette, ov: EditorialOverlays) =>
  // @style-allow stylesheet: themed editorial style factory consumed by N components (parity with DS internal pattern)
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 22, paddingBottom: 48, gap: 26 },
    centered: { alignItems: "center", justifyContent: "center" },
    // Floating add CTA pinned over the scroll (so its backdrop blur frosts the
    // content scrolling behind it); `bottom` is set inline from the tab height.
    floatingAdd: { position: "absolute", left: 22, right: 22 },

    // Desktop web (≥1024): the page reads left-to-right — wide identity band
    // up top (a masthead closed by a hairline), then a two-column body
    // (sections main + insights rail). The floating CTA becomes an inline ink
    // slab under the sections list.
    bodyWide: { flexDirection: "row", alignItems: "flex-start", gap: 36 },
    mainColWide: { flex: 1, minWidth: 0, gap: 26 },
    railWide: { width: 320, gap: 20 },

    // header — cover banner, then the avatar overlapping it from below.
    header: { alignItems: "center", gap: 12 },
    // Desktop header: cover, then avatar left with the identity text beside
    // it, page-aligned left, closed by a hairline rule so the whole thing
    // reads as the page's masthead.
    headerWide: {
      gap: 14,
      paddingBottom: 30,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    // `flex-start` so the avatar's negative top margin actually lifts it over
    // the banner instead of being re-centred against the taller text block.
    headerWideRow: { flexDirection: "row", alignItems: "flex-start", gap: 30 },
    headerWideBody: { flex: 1, minWidth: 0, gap: 7, alignItems: "flex-start" },
    // The banner runs edge to edge: it cancels the scroll's 22pt page gutter.
    coverWrap: { alignSelf: "stretch", marginHorizontal: -22 },
    coverBadge: {
      position: "absolute",
      right: 14,
      bottom: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: p.bg,
    },
    avatarWrap: { position: "relative" },
    avatarUploading: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // Fully rounded rather than half-of-80: the avatar box now varies with
      // the bezel and the breakpoint, and this has to stay a circle in both.
      borderRadius: 999,
      backgroundColor: ov.scrimMedia,
      alignItems: "center",
      justifyContent: "center",
    },
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
    completenessBadge: {
      position: "absolute",
      left: -4,
      bottom: -4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: p.ink,
      borderWidth: 2,
      borderColor: p.bg,
    },
    completenessText: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      fontWeight: "600",
      color: p.bg,
    },
    name: {
      fontFamily: fonts.serif,
      fontSize: 27,
      lineHeight: 33,
      // Slight negative tracking reads tighter at display size.
      letterSpacing: -0.3,
      color: p.ink,
      textAlign: "center",
    },
    nameWide: { fontSize: 36, lineHeight: 44, letterSpacing: -0.6, textAlign: "left" },
    headline: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      lineHeight: 20,
      letterSpacing: 0.1,
      color: p.body,
      textAlign: "center",
    },
    headlineWide: { fontSize: 15.5, lineHeight: 22, textAlign: "left" },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    location: { fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.2, color: p.muted },
    headlinePlaceholder: { color: p.subtle, fontStyle: "italic" },

    // first-paint skeleton
    skeletonCard: { gap: 12 },

    // "Perfil" sub-tab body
    masterTab: { gap: 26 },

    // master resume mini-preview banner (tap → full preview modal)
    previewBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 14,
      backgroundColor: p.surface,
      padding: 12,
    },
    previewBannerBody: { flex: 1, gap: 3 },
    previewBannerTitle: {
      fontFamily: fonts.sans,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.2,
      color: p.ink,
    },
    previewBannerMeta: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, color: p.muted },

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
  light: pfFor(editorialPalette, editorialOverlays.light),
  dark: pfFor(editorialPaletteDark, editorialOverlays.dark),
} as const;

/** Theme-aware accessor for the Profile tab stylesheet. */
export function usePf(): (typeof pfByTheme)["light"] {
  return pfByTheme[useThemeName()];
}
