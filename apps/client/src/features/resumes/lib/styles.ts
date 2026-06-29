/** Editorial Calm styles for the resumes feature (list sub-tab + detail). */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const rzFor = (p: EditorialPalette) =>
  // @style-allow stylesheet: themed editorial style factory consumed via style prop by 5 components (parity with the DS internal pattern)
  StyleSheet.create({
    // list sub-tab
    list: { gap: 12 },
    slotsRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    slotsLabel: {
      fontFamily: fonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: p.muted,
    },
    slotsCount: { fontFamily: fonts.mono, fontSize: 13, color: p.ink },

    // resume card
    card: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 16,
      backgroundColor: p.surface,
      padding: 16,
      gap: 10,
    },
    cardActive: {
      borderColor: p.hairlineStrong,
      shadowColor: "#0A0A0A",
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
    cardTitleWrap: { flex: 1, gap: 4 },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    cardTitle: { fontFamily: fonts.serif, fontSize: 19, color: p.ink },
    masterBadge: {
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    masterBadgeText: {
      fontFamily: fonts.sans,
      fontSize: 9.5,
      fontWeight: "600",
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: p.muted,
    },
    cardMeta: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: p.muted },
    headActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    eyeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: p.hairline,
    },
    // web-only inline row actions (revealed on hover/focus of the card)
    headActionBtnActive: { borderColor: p.hairlineStrong, backgroundColor: p.bg },
    headActionBtnDanger: {
      borderColor: p.danger,
      // @style-allow color: translucent red tint for the web inline delete action's hover state (intentional danger overlay, not a token surface)
      backgroundColor: "rgba(220,38,38,0.08)",
    },

    // native swipe-to-reveal action drawer (behind the card, right side)
    swipeActions: { flexDirection: "row", alignItems: "stretch" },
    swipeAction: {
      width: 76,
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    swipeActionDuplicate: { backgroundColor: p.bg },
    swipeActionDelete: { backgroundColor: p.danger },
    swipeActionLabel: {
      fontFamily: fonts.sans,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    swipeActionLabelDuplicate: { color: p.ink },
    swipeActionLabelDelete: { color: p.onPrimary },

    // tailored variants under a card
    tailoredList: { gap: 6, marginTop: 2 },
    tailoredRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingLeft: 6,
    },
    tailoredText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: p.muted },
    tailoredJob: { color: p.ink },

    // create box (mirrors the section manager's dashed add box)
    createBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderStyle: "dashed",
      borderRadius: 14,
      paddingVertical: 15,
      marginTop: 4,
    },
    createBoxLabel: {
      fontFamily: fonts.sans,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: p.ink,
    },
    createBoxDisabled: { opacity: 0.45 },
    slotsNote: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: p.subtle,
      textAlign: "center",
      marginTop: 6,
    },

    // detail screen
    detailRoot: { flex: 1, backgroundColor: p.bg },
    detailHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
      backgroundColor: p.surface,
    },
    detailTitle: { flex: 1, fontFamily: fonts.serif, fontSize: 20, color: p.ink },
    detailScroll: { paddingHorizontal: 22, paddingBottom: 48, gap: 26, paddingTop: 20 },
    previewFrame: {
      height: 380,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: p.surface,
    },
    metaBlock: { gap: 6 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    metaValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    metaLabel: { fontFamily: fonts.sans, fontSize: 12, color: p.muted },
    metaValue: { fontFamily: fonts.sans, fontSize: 13.5, color: p.ink, textAlign: "right" },

    // actions row
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    actionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: p.surface,
    },
    actionLabel: {
      fontFamily: fonts.sans,
      fontSize: 12.5,
      fontWeight: "500",
      letterSpacing: 0.2,
      color: p.ink,
    },
    actionDanger: { borderColor: p.danger },
    actionDangerLabel: { color: p.danger },

    sectionLabel: {
      fontFamily: fonts.sans,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1.8,
      textTransform: "uppercase",
      color: p.muted,
    },

    // wizard — adaptive modal card (grows with content up to a cap, then the
    // scroll body shrinks/scrolls) so short steps don't leave a tall void.
    wizardCard: {
      width: "90%",
      maxWidth: 560,
      maxHeight: "86%",
      backgroundColor: p.surface,
      borderRadius: 24,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 14 },
      elevation: 14,
    },
    wizardScroll: { flexShrink: 1 },
    // top progress strip — flush to the card's top edge, fills per step
    progressTrack: { height: 3, width: "100%", backgroundColor: p.hairline },
    progressFillHalf: { height: "100%", width: "50%", backgroundColor: p.ink },
    progressFillFull: { height: "100%", width: "100%", backgroundColor: p.ink },
    wizardHint: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: p.muted },

    // step-1 checklist — each master section is a card; items are hairline-divided rows
    checklist: { gap: 14, marginTop: 20 },
    secCard: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 18,
      backgroundColor: p.bg,
      overflow: "hidden",
    },
    secHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    secHeaderText: { flex: 1, gap: 1 },
    secTitle: { fontFamily: fonts.serif, fontSize: 17, color: p.ink },
    secCount: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.6,
      color: p.muted,
      fontVariant: ["tabular-nums"],
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
    },
    itemBody: { flex: 1, gap: 2 },
    itemPrimary: { fontFamily: fonts.sans, fontSize: 14.5, color: p.ink },
    itemMeta: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, color: p.muted },
    itemRowOff: { opacity: 0.5 },

    // checkbox (shared by master + item)
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: p.hairlineStrong,
      backgroundColor: p.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    checkBoxChecked: { backgroundColor: p.ink, borderColor: p.ink },

    // recap — anchors the bottom of the short step so the eye has an endpoint
    recapRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
    },
    recapDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.ink },
    recapText: { fontFamily: fonts.sans, fontSize: 12.5, letterSpacing: 0.2, color: p.muted },

    centered: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 },
    centeredText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: p.muted,
      textAlign: "center",
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const rzByTheme = {
  light: rzFor(editorialPalette),
  dark: rzFor(editorialPaletteDark),
} as const;

/** Theme-aware accessor for the resumes feature stylesheet. */
export function useRz(): (typeof rzByTheme)["light"] {
  return rzByTheme[useThemeName()];
}
