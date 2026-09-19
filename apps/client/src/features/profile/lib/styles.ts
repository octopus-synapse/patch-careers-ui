/** Editorial Calm styles for the Profile tab (paper bg, serif headings, hairlines). */
import {
  type EditorialOverlays,
  type EditorialPalette,
  editorialOverlays,
  editorialPalette,
  editorialPaletteDark,
  identityMediaControl,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const pfFor = (p: EditorialPalette, ov: EditorialOverlays) =>
  // @style-allow stylesheet: themed editorial style factory consumed by N components (parity with DS internal pattern)
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 22, paddingBottom: 48, gap: 26 },
    centered: { alignItems: "center", justifyContent: "center" },
    // Floating add CTA pinned over the scroll; `bottom` follows the tab height.
    floatingAdd: { position: "absolute", left: 22, right: 22 },
    floatingAddWide: {
      position: "absolute",
      right: 22,
      bottom: 24,
      width: 240,
      borderRadius: 999,
      shadowColor: p.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    fieldEditorScroll: { flexShrink: 1 },

    // Desktop web (≥1024): two columns starting at the SAME top edge — the
    // cover and the rail's first card begin on one line. The header used to
    // sit above the split, which pushed the rail down by the height of the
    // masthead and left the top-right of the page empty.
    //
    // Everything in both columns is a card on the page's paper: the header,
    // each section, each rail panel. Separation is the frame, not the gap.
    bodyWide: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
    mainColWide: { flex: 1, minWidth: 0, gap: 16 },
    railWide: { width: 300, gap: 16 },

    /** The shared card frame — same border and paper as every rail panel. */
    cardWide: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 20,
      backgroundColor: p.panel,
    },
    /** Card padding for the main column's blocks. */
    cardBodyWide: { paddingHorizontal: 36, paddingVertical: 32 },
    railCard: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 20,
      backgroundColor: p.panel,
      padding: 20,
    },
    railCardTitle: {
      fontFamily: fonts.serif,
      fontSize: 17,
      lineHeight: 23,
      letterSpacing: -0.2,
      color: p.ink,
    },
    railCardHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    // ── Identity, rendered open (desktop main column) ──
    // The heading is sans, not the page serif: the serif is spoken by the
    // person's name in the masthead, and repeating it on every card title
    // flattened "who this is" against "what is in here".
    panelTitle: {
      fontFamily: fonts.sans,
      fontSize: 22,
      fontWeight: "600",
      letterSpacing: -0.4,
      color: p.ink,
      marginBottom: 40,
    },
    idRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    idRowLast: { borderBottomWidth: 0 },
    // A fixed label column is what makes five unrelated values read as one
    // table instead of five sentences.
    idLabel: { width: 104, fontFamily: fonts.sans, fontSize: 12.5, color: p.muted },
    idValue: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, color: p.ink },
    idGaps: { marginTop: 32 },
    gapList: { marginTop: 16, gap: 7 },
    gapRow: { flexDirection: "row", gap: 8 },
    gapDash: { fontFamily: fonts.sans, fontSize: 13, color: p.subtle },
    gapText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: p.muted },

    // ── Score, rail card ──
    scoreRow: { marginTop: 24, flexDirection: "row", alignItems: "center", gap: 16 },
    scoreLines: { flex: 1, minWidth: 0 },
    scoreLineSplit: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
    },
    scoreLineHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    scoreLineLabel: {
      flex: 1,
      minWidth: 0,
      fontFamily: fonts.sans,
      fontSize: 12.5,
      fontWeight: "500",
      color: p.ink,
    },
    scoreLineValue: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 17 },
    scoreLineBar: { marginTop: 6 },
    scoreEmpty: {
      marginTop: 14,
      fontFamily: fonts.sans,
      fontSize: 12.5,
      lineHeight: 18,
      color: p.muted,
    },

    // ── Score, dialog ──
    dialogBody: { flexDirection: "row", alignItems: "flex-start", gap: 36 },
    dialogLeft: { flex: 1, minWidth: 0, gap: 12 },
    dialogRight: { width: 320 },
    /**
     * Nesting is said by containment: Estilo is a box of one, Qualidade a box
     * that holds its two children in a compartment. The inner rules bleed to
     * the border, so they cut the box instead of floating inside it.
     */
    scoreBlock: { borderWidth: 1, borderColor: p.hairline, borderRadius: 16 },
    scoreBlockBody: { padding: 20 },
    scoreBlockHead: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 16,
    },
    scoreBlockName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "600", color: p.ink },
    scoreBlockValue: { fontFamily: fonts.serif, fontSize: 27, lineHeight: 27 },
    scoreBlockWhat: {
      marginTop: 4,
      fontFamily: fonts.sans,
      fontSize: 12.5,
      lineHeight: 17,
      color: p.muted,
    },
    scoreBlockBar: { marginTop: 12 },
    scoreSub: {
      borderTopWidth: 1,
      borderTopColor: p.hairline,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    scoreSubName: { fontFamily: fonts.sans, fontSize: 13, fontWeight: "500", color: p.ink },
    scoreSubValue: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 20 },
    scoreSubBar: { marginTop: 10 },
    dialogRingWrap: { alignItems: "center" },
    dialogRingCaption: { marginTop: 12, fontFamily: fonts.sans, fontSize: 12.5, color: p.muted },
    dialogRadar: { marginTop: 28 },
    quietLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
    quietLinkLabel: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: "500", color: p.muted },
    dialogLink: { marginTop: 28 },

    // ── Resume language ──
    languageCard: { paddingVertical: 24, gap: 18 },
    railCaption: {
      marginTop: 12,
      fontFamily: fonts.sans,
      fontSize: 11.5,
      lineHeight: 16,
      color: p.subtle,
    },

    // ── Public profile ──
    publicUrl: {
      marginTop: 10,
      fontFamily: fonts.mono,
      fontSize: 12.5,
      lineHeight: 18,
      color: p.body,
    },
    publicCopied: { marginTop: 6, fontFamily: fonts.sans, fontSize: 11.5, color: p.accent },
    publicHint: {
      marginTop: 10,
      fontFamily: fonts.sans,
      fontSize: 12.5,
      lineHeight: 18,
      color: p.muted,
    },

    // ── "Falta no seu perfil" ──
    gapsList: { marginTop: 12 },
    gapsItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 11,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
    },
    gapsItemFirst: { borderTopWidth: 0 },
    gapsItemLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: p.ink },

    /** Mono versalete — the page's quiet label voice ("FALTA"). */
    smallcaps: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      fontWeight: "500",
      letterSpacing: 1.7,
      textTransform: "uppercase",
      color: p.subtle,
    },

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
    /**
     * The header as a card. `overflow: "hidden"` is what rounds the cover's
     * two top corners — the banner is the card's first child and runs edge to
     * edge. The masthead hairline is gone: the card border already closes it,
     * and two rules in the same place read as a mistake.
     *
     * Gated to desktop web by the caller: `overflow` + `borderRadius` clipping
     * is reliable on web but flaky on Android.
     */
    headerCardWide: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 20,
      backgroundColor: p.panel,
      overflow: "hidden",
    },
    headerCardBodyWide: { paddingHorizontal: 36, paddingBottom: 36, paddingTop: 14 },
    /** Inside a card the banner spans the card, so it cancels no gutter. */
    coverWrapCard: { alignSelf: "stretch" },
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
      backgroundColor: identityMediaControl.rest,
      alignItems: "center",
      justifyContent: "center",
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
      right: 4,
      bottom: 4,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: identityMediaControl.rest,
      alignItems: "center",
      justifyContent: "center",
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
