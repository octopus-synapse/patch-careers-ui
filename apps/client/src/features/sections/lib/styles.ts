/**
 * Shared "Editorial Calm" stylesheet for the onboarding wizard AND the reusable
 * section editor (work experience / education) used on the Profile tab. It was
 * extracted verbatim from `OnboardingWizard.tsx` so both surfaces render
 * pixel-identically; the wizard imports `ed`/`eyebrow`/`webNoOutline` from here.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { Platform, StyleSheet, type ViewStyle } from "react-native";

/** Shared "small-caps eyebrow" recipe; entries add fontSize/letterSpacing/color. */
export const eyebrow = {
  fontFamily: fonts.sans,
  fontWeight: "600",
  textTransform: "uppercase",
} as const;

// RN Web paints a default blue focus outline on Pressables; the saved-entry
// cards replace it with their own `active` lift (which also covers keyboard
// focus), so the raw outline is suppressed only there. `outlineStyle` is a
// web-only style key absent from RN's ViewStyle.
export const webNoOutline =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as ViewStyle) : null;

// Overlay washes that aren't derivable from the palette itself: modal scrims
// and the destructive hover tint, tuned per scheme.
type OverlayColors = { scrim: string; dangerTint: string };

const createEd = (authTokens: EditorialPalette, overlay: OverlayColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: authTokens.bg },
    flex: { flex: 1 },
    // Page fills the viewport and centers the cluster vertically. Because the body
    // is a fixed height (set inline from the viewport), the cluster's total height
    // is constant — the masthead and footer land at the same Y on every step.
    page: { flex: 1, justifyContent: "center", paddingTop: 24, paddingBottom: 28 },
    column: { width: "100%", maxWidth: 460, alignSelf: "center" },
    // Body content sits at the TOP of the fixed box (right under the subtitle), so
    // short steps read top-anchored while the box itself stays centered in the
    // viewport. flexGrow keeps the scroll area full-height; taller steps scroll.
    bodyScroll: { flexGrow: 1, justifyContent: "flex-start" },

    // masthead + progress
    mastheadWrap: { marginBottom: 36 },
    mastheadBrand: {
      alignItems: "center",
      marginBottom: 26,
    },
    mastheadMeta: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 14,
    },
    phaseLabel: {
      ...eyebrow,
      fontSize: 10,
      letterSpacing: 1.8,
      color: authTokens.ink,
    },
    timeText: {
      fontFamily: fonts.mono,
      fontSize: 15.6,
      fontWeight: "600",
      letterSpacing: 0.4,
      color: authTokens.ink,
    },
    track: {
      height: 2,
      width: "100%",
      backgroundColor: authTokens.hairline,
      borderRadius: 2,
      overflow: "hidden",
    },
    fill: { height: "100%", backgroundColor: authTokens.ink, borderRadius: 2 },

    // heading
    heading: {
      fontFamily: fonts.serif,
      fontSize: 34,
      lineHeight: 40,
      color: authTokens.ink,
      letterSpacing: -0.6,
      fontWeight: "400",
    },
    headingRegular: { fontStyle: "normal" },
    headingItalic: { fontStyle: "italic" },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      color: authTokens.body,
      marginTop: 12,
      // Full column width (was capped at 380) so blocks share one width rhythm.
    },
    body: { marginTop: 34 },

    // footer
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 36,
    },
    footerError: { alignItems: "flex-end", marginTop: 10 },
    skipRow: { alignItems: "center", marginTop: 22 },
    ackRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    ackBox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: authTokens.hairlineStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    ackBoxChecked: { backgroundColor: authTokens.ink, borderColor: authTokens.ink },
    ghost: { paddingVertical: 10, paddingHorizontal: 2 },
    ghostLabel: {
      ...eyebrow,
      fontSize: 12,
      letterSpacing: 1.6,
      color: authTokens.muted,
    },
    ghostDanger: { color: authTokens.danger },
    dim: { opacity: 0.4 },

    // fields
    fieldStack: { gap: 26 },
    // Sequentially locked field (education): visible but clearly inert.
    gatedField: { opacity: 0.35 },
    fieldLabel: {
      ...eyebrow,
      fontSize: 10,
      letterSpacing: 1.8,
      color: authTokens.muted,
      marginBottom: 10,
    },
    fieldLabelError: { color: authTokens.danger },
    textarea: {
      fontFamily: fonts.sans,
      fontSize: 17,
      lineHeight: 24,
      color: authTokens.ink,
      paddingVertical: 8,
      minHeight: 92,
      textAlignVertical: "top",
    },
    fieldLine: { height: 1, width: "100%", backgroundColor: authTokens.hairlineStrong },
    fieldLineFocused: { height: 1.5, backgroundColor: authTokens.accent },
    fieldLineError: { height: 1.5, backgroundColor: authTokens.danger },

    // option pills
    pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 9,
      backgroundColor: authTokens.surface,
    },
    pillSelected: { borderColor: authTokens.ink, backgroundColor: authTokens.ink },
    pillLabel: {
      fontFamily: fonts.sans,
      fontSize: 13,
      letterSpacing: 0.2,
      fontWeight: "500",
      color: authTokens.body,
    },
    pillLabelSelected: { color: authTokens.surface },

    // username chip
    chip: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
    chipDot: { width: 6, height: 6, borderRadius: 3 },
    chipText: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },

    // date field (trigger mimics the underline input)
    dateField: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 40,
      paddingVertical: 8,
    },
    dateValue: { fontFamily: fonts.sans, fontSize: 18, color: authTokens.ink },
    datePlaceholder: { color: authTokens.subtle },

    // month/year picker
    pickerOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      backgroundColor: overlay.scrim,
    },
    pickerCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: authTokens.bg,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 18,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    pickerTitle: { fontFamily: fonts.serif, fontSize: 20, color: authTokens.ink },
    pickerYearRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
    },
    pickerYear: {
      fontFamily: fonts.mono,
      fontSize: 18,
      letterSpacing: 1,
      color: authTokens.ink,
      minWidth: 64,
      textAlign: "center",
    },
    pickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    pickerMonth: {
      width: "31%",
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: authTokens.hairline,
      backgroundColor: authTokens.surface,
    },
    pickerMonthSelected: { backgroundColor: authTokens.ink, borderColor: authTokens.ink },
    pickerMonthText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: authTokens.body,
      textTransform: "capitalize",
    },
    pickerMonthTextSelected: { color: authTokens.surface },
    pickerClear: { alignItems: "center", paddingVertical: 6 },
    pickerClearText: {
      ...eyebrow,
      fontSize: 12,
      letterSpacing: 1.4,
      color: authTokens.muted,
    },

    // language
    langWrap: { gap: 10 },
    langCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: authTokens.surface,
    },
    langCardSelected: { borderColor: authTokens.ink },
    langText: { flex: 1, gap: 3 },
    langLabel: { fontFamily: fonts.serif, fontSize: 19, color: authTokens.ink },
    langHint: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: authTokens.muted },

    // step context — fills out short steps (link preview + reassurance notes)
    context: { marginTop: 28 },
    contextRule: {
      height: 1,
      width: 28,
      backgroundColor: authTokens.hairlineStrong,
      marginBottom: 12,
    },
    contextLabel: {
      ...eyebrow,
      fontSize: 10,
      letterSpacing: 1.8,
      color: authTokens.muted,
      marginBottom: 8,
    },
    contextBody: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: authTokens.body },
    linkCard: {
      borderWidth: 1,
      borderColor: authTokens.hairline,
      borderRadius: 14,
      backgroundColor: authTokens.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 6,
    },
    linkCardLabel: {
      ...eyebrow,
      fontSize: 10,
      letterSpacing: 1.8,
      color: authTokens.muted,
    },
    linkUrl: { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 0.2, color: authTokens.subtle },
    linkHandle: { color: authTokens.ink },
    linkNote: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: authTokens.muted },

    // multi-item — saved entry cards
    list: { gap: 10 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: authTokens.surface,
      borderWidth: 1,
      borderColor: authTokens.hairline,
      borderRadius: 14,
      paddingVertical: 13,
      paddingLeft: 16,
      paddingRight: 8,
    },
    cardActive: {
      borderColor: authTokens.hairlineStrong,
      shadowColor: "#0A0A0A",
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    cardIndex: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: 0.5,
      color: authTokens.subtle,
      minWidth: 18,
    },
    cardBody: { flex: 1, gap: 3 },
    cardPrimary: {
      fontFamily: fonts.sans,
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.1,
      color: authTokens.ink,
    },
    cardMeta: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 16, color: authTokens.muted },
    cardRemove: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    cardRemoveActive: { backgroundColor: overlay.dangerTint },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
      paddingLeft: 2,
      marginTop: 4,
    },
    addLabel: {
      ...eyebrow,
      fontSize: 12,
      letterSpacing: 1.4,
      color: authTokens.ink,
    },
    // full-screen item editor modal
    editorModalOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: overlay.scrim,
    },
    editorModalBackdrop: { ...StyleSheet.absoluteFillObject },
    editorModalCard: {
      width: "90%",
      height: "90%",
      maxWidth: 560,
      backgroundColor: authTokens.bg,
      borderRadius: 22,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    editorModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 22,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: authTokens.hairline,
    },
    editorModalTitle: { fontFamily: fonts.serif, fontSize: 22, color: authTokens.ink },
    editorModalScroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
    editorModalFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: authTokens.hairline,
    },

    // resume style
    styleStack: { gap: 12 },
    styleCard: {
      flexDirection: "row",
      gap: 14,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 18,
      backgroundColor: authTokens.surface,
      padding: 14,
    },
    styleCardSelected: { borderColor: authTokens.ink },
    styleImage: { width: 60, height: 80, borderRadius: 10, backgroundColor: authTokens.hairline },
    styleBody: { flex: 1, gap: 4, justifyContent: "center" },
    styleNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    styleName: { fontFamily: fonts.serif, fontSize: 18, color: authTokens.ink },
    styleDesc: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: authTokens.muted },
    styleAts: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.5,
      color: authTokens.success,
    },

    // review
    reviewCard: {
      borderWidth: 1,
      borderColor: authTokens.hairline,
      borderRadius: 18,
      backgroundColor: authTokens.surface,
      padding: 18,
      marginBottom: 12,
    },
    reviewHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    reviewLabel: {
      ...eyebrow,
      fontSize: 10,
      letterSpacing: 1.6,
      color: authTokens.muted,
    },
    reviewSkipped: { fontFamily: fonts.sans, fontSize: 14, color: authTokens.subtle },
    reviewStyleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    reviewStyleName: { fontFamily: fonts.serif, fontSize: 17, color: authTokens.ink },
    reviewImage: { width: 48, height: 64, borderRadius: 8, backgroundColor: authTokens.hairline },
    reviewPreviewBox: { overflow: "hidden", backgroundColor: authTokens.surface },
    reviewEntry: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 7 },
    reviewEntryLabel: { fontFamily: fonts.sans, fontSize: 12, color: authTokens.muted, flex: 1 },
    reviewEntryValue: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: authTokens.ink,
      flex: 2,
      textAlign: "right",
    },
    reviewEntryLong: { textAlign: "left" },
    addSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderStyle: "dashed",
      borderRadius: 14,
      paddingVertical: 15,
      marginTop: 4,
    },
    addSectionLabel: {
      ...eyebrow,
      fontSize: 12,
      letterSpacing: 1.2,
      color: authTokens.ink,
    },

    // states
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 28,
      backgroundColor: authTokens.bg,
    },
    centeredText: {
      fontFamily: fonts.sans,
      fontSize: 15,
      color: authTokens.body,
      textAlign: "center",
    },

    // welcome
    welcomeWrap: {
      flex: 1,
      width: "100%",
      maxWidth: 460,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      paddingHorizontal: 28,
    },
    welcomeArt: { marginVertical: 8 },
    welcomeHeading: {
      fontFamily: fonts.serif,
      fontSize: 32,
      lineHeight: 38,
      color: authTokens.ink,
      letterSpacing: -0.6,
      textAlign: "center",
    },
    welcomeTagline: {
      fontFamily: fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      color: authTokens.body,
      textAlign: "center",
      maxWidth: 340,
    },
    welcomeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: authTokens.surface,
    },
    welcomeBadgeText: {
      fontFamily: fonts.sans,
      fontSize: 12,
      letterSpacing: 0.4,
      fontWeight: "600",
      color: authTokens.ink,
    },
    welcomeCta: { width: "100%", marginTop: 8, alignItems: "stretch" },

    // resume banner
    resumeBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 14,
      backgroundColor: authTokens.surface,
      padding: 14,
      marginBottom: 20,
    },
    resumeBannerBody: { flex: 1, gap: 2 },
    resumeBannerTitle: { fontFamily: fonts.serif, fontSize: 16, color: authTokens.ink },
    resumeBannerSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: authTokens.muted },

    // retry banner
    retryBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: authTokens.danger,
      borderRadius: 12,
      backgroundColor: authTokens.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 12,
    },
    retryText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: authTokens.danger },

    // missing-required banner
    missingBanner: {
      borderWidth: 1,
      borderColor: authTokens.warn,
      borderRadius: 14,
      backgroundColor: authTokens.surface,
      padding: 16,
      marginBottom: 16,
      gap: 4,
    },
    missingHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    missingTitle: {
      ...eyebrow,
      fontSize: 10,
      letterSpacing: 1.6,
      color: authTokens.warn,
    },
    missingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: authTokens.hairline,
    },
    missingLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: authTokens.ink },
    missingFix: {
      ...eyebrow,
      fontSize: 11,
      letterSpacing: 1.2,
      color: authTokens.accent,
    },

    // section empty state
    emptyState: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 20,
    },
    emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: authTokens.ink, marginTop: 4 },
    emptyBody: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: authTokens.muted,
      textAlign: "center",
      maxWidth: 300,
    },
    emptyAdd: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 11,
      marginTop: 6,
    },

    // section "no fields" safety-net notice
    noticeCard: {
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 16,
      backgroundColor: authTokens.surface,
      paddingVertical: 28,
      paddingHorizontal: 22,
    },
    noticeTitle: {
      fontFamily: fonts.serif,
      fontSize: 18,
      color: authTokens.ink,
      textAlign: "center",
    },
    noticeBody: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: authTokens.muted,
      textAlign: "center",
      maxWidth: 300,
    },

    // resume-style preview hint + modal
    stylePreviewHint: {
      fontFamily: fonts.sans,
      fontSize: 11,
      letterSpacing: 0.4,
      color: authTokens.subtle,
      marginTop: 2,
    },
    modalScroll: { gap: 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
    modalFooter: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: authTokens.hairline,
    },
    modalPreview: {
      width: "100%",
      aspectRatio: 1 / Math.SQRT2, // A4 portrait (√2 ratio) — height scales with card width
      borderRadius: 14,
      backgroundColor: authTokens.surface,
      overflow: "hidden",
    },
    modalPreviewEmpty: { borderWidth: 1, borderColor: authTokens.hairline },
    modalPreviewCenter: { alignItems: "center", justifyContent: "center" },
    modalPreviewHint: { fontFamily: fonts.sans, fontSize: 13, color: authTokens.muted },
    modalDesc: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: authTokens.body,
      alignSelf: "stretch",
    },
    atsSeal: {
      alignSelf: "stretch",
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 14,
      backgroundColor: authTokens.surface,
      padding: 14,
      gap: 4,
    },
    atsSealLabel: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: 0.4,
      color: authTokens.ink,
    },
    atsSealBlurb: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: authTokens.muted },
  });

// Precomputed per theme so style-object identity is stable across renders.
const edByTheme = {
  light: createEd(editorialPalette, {
    scrim: "rgba(10,10,10,0.45)",
    dangerTint: "rgba(220,38,38,0.08)",
  }),
  dark: createEd(editorialPaletteDark, {
    scrim: "rgba(0,0,0,0.6)",
    dangerTint: "rgba(248,113,113,0.12)",
  }),
} as const;

/** Theme-aware accessor for the shared editorial wizard/editor styles. */
export function useEd(): (typeof edByTheme)["light"] {
  return edByTheme[useThemeName()];
}
