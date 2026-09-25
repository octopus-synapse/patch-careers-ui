/**
 * Shared "Editorial Calm" stylesheet for the onboarding wizard AND the reusable
 * section editor (work experience / education) used on the Profile tab. It was
 * extracted verbatim from `OnboardingWizard.tsx` so both surfaces render
 * pixel-identically; the wizard imports `ed`/`eyebrow`/`webNoOutline` from here.
 */
import {
  authDialogPalette,
  type EditorialOverlays,
  type EditorialPalette,
  editorialOverlays,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { Platform, StyleSheet, type ViewStyle } from "react-native";

/** Shared sentence-case label recipe; entries add fontSize/letterSpacing/color.
 *  (Formerly the uppercase "eyebrow" — the all-caps treatment was dropped for
 *  a calmer read; the export name stays for compatibility.) */
export const eyebrow = {
  fontFamily: fonts.sans,
  fontWeight: "600",
} as const;

// RN Web paints a default blue focus outline on Pressables; the saved-entry
// cards replace it with their own `active` lift (which also covers keyboard
// focus), so the raw outline is suppressed only there. `outlineStyle` is a
// web-only style key absent from RN's ViewStyle.
export const webNoOutline =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as ViewStyle) : null;

const createEd = (
  authTokens: EditorialPalette,
  overlay: EditorialOverlays,
  theme: "light" | "dark",
) =>
  // @style-allow stylesheet: themed editorial style factory consumed by N components (parity with DS internal pattern)
  StyleSheet.create({
    root: { flex: 1, backgroundColor: authTokens.bg },
    flex: { flex: 1 },
    // Page fills the viewport and centers the cluster vertically. Because the body
    // is a fixed height (set inline from the viewport), the cluster's total height
    // is constant — the masthead and footer land at the same Y on every step.
    page: {
      flex: 1,
      justifyContent: "center",
      paddingTop: 24,
      paddingBottom: 28,
    },
    column: { width: "100%", maxWidth: 460, alignSelf: "center" },
    mobileWizardPanel: { backgroundColor: "transparent", borderWidth: 0, borderRadius: 0 },
    mobileWizardContent: { flex: 1 },
    desktopWizardContent: { flex: 1 },
    // Body content sits at the TOP of the fixed box (right under the subtitle), so
    // short steps read top-anchored while the box itself stays centered in the
    // viewport. flexGrow keeps the scroll area full-height; taller steps scroll.
    bodyScroll: { flexGrow: 1, justifyContent: "flex-start" },
    desktopBodyScroll: { paddingRight: 14, paddingBottom: 8 },

    // masthead + progress
    mastheadWrap: { marginBottom: 36 },
    mastheadMeta: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 14,
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
    fill: { height: "100%", backgroundColor: authDialogPalette[theme].brand, borderRadius: 2 },

    // heading
    stepTag: {
      fontFamily: fonts.mono,
      fontSize: 11.5,
      fontWeight: "600",
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: authTokens.subtle,
      marginBottom: 10,
    },
    heading: {
      fontFamily: fonts.sans,
      fontSize: 34,
      lineHeight: 40,
      color: authDialogPalette[theme].brand,
      letterSpacing: -1.2,
      fontWeight: "600",
    },
    // Matches the auth flow's display title (e.g. "Good to see you again.").
    displayHeading: {
      fontFamily: fonts.serif,
      fontSize: 40,
      lineHeight: 43,
      color: authTokens.ink,
      letterSpacing: -1.2,
      fontWeight: "700",
    },
    displayHeadingLarge: { fontSize: 48, lineHeight: 52 },
    headingRegular: { fontStyle: "normal" },
    headingItalic: { fontStyle: "italic" },
    // Keep the tail as a separate style slot so the heading can share its
    // brand treatment with the auth and landing surfaces.
    headingAccent: { fontStyle: "normal", color: authDialogPalette[theme].brand },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      color: authTokens.body,
      marginTop: 12,
      // Full column width (was capped at 380) so blocks share one width rhythm.
    },
    body: { marginTop: 34 },
    mobileWizardBody: { flex: 1, minHeight: 0, marginTop: 42 },
    desktopWizardBody: { flex: 1, minHeight: 0, marginTop: 26 },

    // footer
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 36,
    },
    mobileWizardFooter: { justifyContent: "flex-end", gap: 28 },
    desktopWizardFooter: { marginTop: 24 },
    mobileWizardAction: { width: "72%" },
    desktopWizardAction: { width: 220 },
    languageWizardAction: { width: "100%" },
    footerError: { alignItems: "flex-end", marginTop: 10 },
    ghost: { paddingVertical: 10, paddingHorizontal: 2 },
    ghostLabel: {
      ...eyebrow,
      fontSize: 13,
      letterSpacing: 0.4,
      color: authDialogPalette[theme].brand,
    },
    ghostMuted: { color: authTokens.muted },
    ghostDanger: { color: authTokens.danger },
    dim: { opacity: 0.4 },

    // fields
    fieldStack: { gap: 26 },
    // Sequentially locked field (education): visible but clearly inert.
    gatedField: { opacity: 0.35 },
    fieldLabel: {
      ...eyebrow,
      fontSize: 13,
      fontWeight: "500",
      letterSpacing: 0.2,
      color: authTokens.muted,
      marginBottom: 8,
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
    fieldLine: {
      height: 1,
      width: "100%",
      backgroundColor: authTokens.hairlineStrong,
    },
    fieldLineFocused: { height: 1.5, backgroundColor: authTokens.accent },
    fieldLineError: { height: 1.5, backgroundColor: authTokens.danger },

    // option pills
    pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    // Suggestion chips under a form field (e.g. headline suggestions).
    suggestionRow: { marginTop: 12 },
    pill: {
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 9,
      backgroundColor: authTokens.surface,
    },
    pillSelected: {
      borderColor: authTokens.ink,
      backgroundColor: authTokens.ink,
    },
    pillLabel: {
      fontFamily: fonts.sans,
      fontSize: 13,
      letterSpacing: 0.2,
      fontWeight: "500",
      color: authTokens.body,
    },
    pillLabelSelected: { color: authTokens.surface },
    // Locked-out option (e.g. non-Internship types when the role is an
    // internship): visible but non-interactive.
    pillDisabled: { opacity: 0.4 },
    pillLabelDisabled: { color: authTokens.muted },
    // Explains why a locked field can't be changed (intern → Internship).
    lockHint: {
      fontFamily: fonts.sans,
      fontSize: 12,
      lineHeight: 16,
      color: authTokens.muted,
      marginTop: 8,
    },

    // username chip
    chip: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
    chipDot: { width: 6, height: 6, borderRadius: 3 },
    chipText: {
      fontFamily: fonts.mono,
      fontSize: 12,
      letterSpacing: 0.4,
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
      backgroundColor: overlay.scrimModal,
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
    pickerTitle: {
      fontFamily: fonts.serif,
      fontSize: 20,
      color: authTokens.ink,
    },
    // language
    langWrap: { gap: 16 },
    // The language step has no supporting content beneath its two choices.
    // Give the cards some breathing room from the heading so the group sits
    // closer to the visual centre between the title and full-width action.
    languageChoiceWrap: { paddingTop: 56 },
    langCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 7,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: authTokens.surface,
    },
    langCardSelected: { borderColor: authDialogPalette[theme].brand },
    langText: { flex: 1, gap: 3 },
    langLabel: {
      fontFamily: fonts.sans,
      fontSize: 17,
      fontWeight: "600",
      color: authDialogPalette[theme].brand,
    },
    langHint: {
      fontFamily: fonts.sans,
      fontSize: 12.5,
      lineHeight: 17,
      color: authTokens.muted,
    },

    // step context — the username live link preview
    context: { marginTop: 28 },
    // No frame: the preview reads as a caption under the field, not a card.
    linkCard: { gap: 6 },
    linkCardLabel: {
      ...eyebrow,
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 0.3,
      color: authTokens.muted,
    },
    linkUrl: {
      fontFamily: fonts.mono,
      fontSize: 14,
      letterSpacing: 0.2,
      color: authTokens.subtle,
    },
    linkHandle: { color: authTokens.ink },
    // Links step add-modal: platform picker rows.
    linkKindRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: authTokens.hairline,
    },
    linkKindLabel: {
      fontFamily: fonts.sans,
      fontSize: 16,
      color: authTokens.ink,
    },

    // ── expanded desktop rendering (profile web) ──
    // An item is shown open here: title, org, dates, prose and achievements
    // each get their own line, instead of the two-line `card` summary above.
    panelCard: {
      borderWidth: 1,
      borderColor: authTokens.hairline,
      borderRadius: 20,
      backgroundColor: authTokens.panel,
      paddingHorizontal: 36,
      paddingVertical: 32,
    },
    panelCardTitle: {
      fontFamily: fonts.sans,
      fontSize: 22,
      fontWeight: "600",
      letterSpacing: -0.4,
      color: authTokens.ink,
      marginBottom: 40,
    },
    panelAddRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      minHeight: 36,
      marginTop: 20,
      paddingRight: 10,
    },
    panelAddLabel: {
      fontFamily: fonts.sans,
      fontSize: 13.5,
      lineHeight: 20,
      fontWeight: "500",
      color: authTokens.muted,
    },
    detailRow: {
      position: "relative",
      paddingVertical: 28,
      borderBottomWidth: 1,
      borderBottomColor: authTokens.hairline,
    },
    detailRowFirst: { paddingTop: 0 },
    detailRowLast: { paddingBottom: 0, borderBottomWidth: 0 },
    detailHead: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 16,
      paddingRight: 62,
    },
    detailActions: {
      position: "absolute",
      top: 28,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    detailActionsFirst: { top: 0 },
    detailTitle: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 15,
      fontWeight: "600",
      color: authTokens.ink,
    },
    detailDate: {
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 0.3,
      color: authTokens.muted,
    },
    detailOrg: {
      marginTop: 6,
      fontFamily: fonts.sans,
      fontSize: 13.5,
      color: authTokens.body,
    },
    detailDescription: {
      marginTop: 16,
      fontFamily: fonts.sans,
      fontSize: 13.5,
      lineHeight: 20,
      color: authTokens.body,
    },
    detailAchievements: { marginTop: 16, gap: 7 },
    detailAchievementRow: { flexDirection: "row", gap: 8 },
    detailDash: { fontFamily: fonts.sans, fontSize: 13, color: authTokens.subtle },
    detailAchievement: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 13,
      lineHeight: 19,
      color: authTokens.muted,
    },
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
    cardBody: { flex: 1, gap: 3 },
    cardPrimary: {
      fontFamily: fonts.sans,
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.1,
      color: authTokens.ink,
    },
    cardMeta: {
      fontFamily: fonts.sans,
      fontSize: 12.5,
      lineHeight: 16,
      color: authTokens.muted,
    },
    cardRemove: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    cardRemoveActive: { backgroundColor: overlay.dangerWash },
    // Native swipe-to-delete action behind a saved-entry card.
    cardSwipeAction: {
      width: 68,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      marginLeft: 8,
      backgroundColor: overlay.dangerWash,
    },
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
      fontSize: 13,
      letterSpacing: 0.3,
      color: authTokens.ink,
    },
    // full-screen item editor modal
    editorModalOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: overlay.scrimModal,
    },
    editorModalBackdrop: { ...StyleSheet.absoluteFillObject },
    editorModalCard: {
      width: "90%",
      height: "84%",
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
    editorModalTitle: {
      fontFamily: fonts.serif,
      fontSize: 22,
      color: authTokens.ink,
    },
    editorModalScroll: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    editorialModalScroll: { flexShrink: 1, minHeight: 0 },
    editorialModalScrollContent: { paddingRight: 12, paddingBottom: 24 },
    // Rewrite review (the other language's copy after a hand edit)
    rewriteField: {
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: authTokens.hairline,
      gap: 8,
    },
    rewriteFieldHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rewriteToggle: {
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    rewriteToggleOn: { backgroundColor: authTokens.ink, borderColor: authTokens.ink },
    rewriteToggleLabel: { fontFamily: fonts.sans, fontSize: 12, color: authTokens.muted },
    rewriteToggleLabelOn: { color: authTokens.bg },
    rewriteDiff: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 21, color: authTokens.body },
    rewriteAdded: { color: authTokens.success, fontWeight: "600" },
    rewriteRemoved: { color: authTokens.danger, textDecorationLine: "line-through" },
    rewriteInput: {
      fontFamily: fonts.sans,
      fontSize: 13.5,
      lineHeight: 20,
      color: authTokens.ink,
      borderWidth: 1,
      borderColor: authTokens.hairlineStrong,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
    },
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
    styleImage: {
      width: 60,
      height: 80,
      borderRadius: 10,
      backgroundColor: authTokens.hairline,
    },
    styleBody: { flex: 1, gap: 4, justifyContent: "center" },
    styleNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    styleName: { fontFamily: fonts.serif, fontSize: 18, color: authTokens.ink },
    styleDesc: {
      fontFamily: fonts.sans,
      fontSize: 13,
      lineHeight: 18,
      color: authTokens.muted,
    },

    // review — the steps read as a quiet checklist
    reviewList: { marginBottom: 8 },
    reviewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: authTokens.hairline,
    },
    reviewRowLabel: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 14.5,
      color: authTokens.ink,
    },
    reviewRowValue: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: authTokens.muted,
      maxWidth: "45%",
    },
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
      fontSize: 13,
      letterSpacing: 0.3,
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
    retryText: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 13,
      color: authTokens.danger,
    },

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
    missingHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    missingTitle: {
      ...eyebrow,
      fontSize: 12,
      letterSpacing: 0.3,
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
    missingLabel: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 14,
      color: authTokens.ink,
    },
    missingFix: {
      ...eyebrow,
      fontSize: 12,
      letterSpacing: 0.3,
      color: authTokens.accent,
    },

    // section empty state
    emptyState: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 20,
    },
    emptyTitle: {
      fontFamily: fonts.serif,
      fontSize: 20,
      color: authTokens.ink,
      marginTop: 4,
    },
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
    // Secondary "Visualizar" action inside the style card (the card itself
    // selects; the underline marks the smaller tap target as a link).
    stylePreviewAction: {
      fontFamily: fonts.sans,
      fontSize: 12,
      letterSpacing: 0.3,
      color: authTokens.muted,
      textDecorationLine: "underline",
      marginTop: 2,
      alignSelf: "flex-start",
    },
    modalScroll: {
      gap: 16,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
    },
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
    modalPreviewHint: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: authTokens.muted,
    },
    // body scrollbar — thin editorial track/thumb signalling overflow
    scrollTrack: {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      width: 3,
      borderRadius: 2,
      backgroundColor: authTokens.hairline,
      overflow: "hidden",
    },
    scrollThumb: {
      width: 3,
      borderRadius: 2,
      backgroundColor: authTokens.subtle,
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const edByTheme = {
  light: createEd(editorialPalette, editorialOverlays.light, "light"),
  dark: createEd(editorialPaletteDark, editorialOverlays.dark, "dark"),
} as const;

/** Theme-aware accessor for the shared editorial wizard/editor styles. */
export function useEd(): (typeof edByTheme)["light"] {
  return edByTheme[useThemeName()];
}
