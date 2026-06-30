/** Editorial Calm styles for the Fit questionnaire (one-question-per-screen). */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const fitFor = (p: EditorialPalette) =>
  // @style-allow stylesheet: themed editorial style factory consumed via style prop by the fit questionnaire + likert components
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.surface },
    container: { flex: 1, paddingHorizontal: 24, paddingBottom: 12 },

    // progress masthead
    track: {
      height: 2,
      backgroundColor: p.hairline,
      borderRadius: 2,
      overflow: "hidden",
      marginTop: 12,
    },
    fill: { height: 2, backgroundColor: p.ink, borderRadius: 2 },
    progressMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    progressText: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.3, color: p.muted },

    // question body
    body: { flex: 1, justifyContent: "center", gap: 36 },
    questionText: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 34, color: p.ink },

    // footer
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingTop: 8,
    },
    backButton: { paddingVertical: 14, paddingHorizontal: 4 },
    backLabel: { fontFamily: fonts.sans, fontSize: 15, fontWeight: "600", color: p.muted },
    backLabelHidden: { opacity: 0 },
    primarySlot: { flexShrink: 0 },

    // likert
    likertRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    dot: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    dotSelected: { backgroundColor: p.ink, borderColor: p.ink },
    dotLabel: { fontFamily: fonts.mono, fontSize: 15, color: p.muted },
    dotLabelSelected: { color: p.onPrimary },
    anchorRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
    anchorText: { fontFamily: fonts.sans, fontSize: 12, color: p.subtle, maxWidth: "45%" },
    anchorTextEnd: { textAlign: "right" },

    // binary
    binaryRow: { flexDirection: "row", gap: 12 },
    binaryOption: {
      flex: 1,
      paddingVertical: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      alignItems: "center",
      backgroundColor: "transparent",
    },
    binaryOptionSelected: { backgroundColor: p.ink, borderColor: p.ink },
    binaryLabel: { fontFamily: fonts.sans, fontSize: 16, fontWeight: "600", color: p.body },
    binaryLabelSelected: { color: p.onPrimary },

    // intro
    introWrap: { flex: 1, justifyContent: "center", gap: 16, paddingBottom: 40 },
    introTitle: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 40, color: p.ink },
    introSubtitle: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: p.body },
    introDuration: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.5, color: p.muted },

    // loading / error / done centered states
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      paddingHorizontal: 16,
    },
    centeredTitle: {
      fontFamily: fonts.serif,
      fontSize: 24,
      lineHeight: 30,
      color: p.ink,
      textAlign: "center",
    },
    centeredHint: {
      fontFamily: fonts.sans,
      fontSize: 14,
      lineHeight: 21,
      color: p.muted,
      textAlign: "center",
    },
  });

const stylesByTheme = {
  light: fitFor(editorialPalette),
  dark: fitFor(editorialPaletteDark),
} as const;

export function useFit() {
  return stylesByTheme[useThemeName()];
}
