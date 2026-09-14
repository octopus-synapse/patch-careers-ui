/** Editorial Calm styles for the Match surface (recommendations and breakdown). */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { StyleSheet } from "react-native";

const mtFor = (p: EditorialPalette) =>
  // @style-allow stylesheet: themed editorial style factory for the match/recomendadas surface
  StyleSheet.create({
    section: { paddingTop: 6, paddingBottom: 18, gap: 12 },
    sectionTitle: {
      fontFamily: fonts.sans,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: p.muted,
      paddingHorizontal: 20,
    },
    carousel: { paddingHorizontal: 20, gap: 12 },

    // card
    card: {
      width: 244,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 16,
      backgroundColor: p.surface,
      padding: 14,
      gap: 10,
    },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    company: {
      fontFamily: fonts.sans,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.3,
      color: p.muted,
      flexShrink: 1,
    },
    title: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22, color: p.ink },
    meta: { fontFamily: fonts.sans, fontSize: 12, color: p.subtle },

    // breakdown (job detail)
    chip: {
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tailorBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
      borderRadius: 999,
      paddingVertical: 12,
    },
    tailorBtnDisabled: { opacity: 0.6 },
  });

const stylesByTheme = {
  light: mtFor(editorialPalette),
  dark: mtFor(editorialPaletteDark),
} as const;

export function useMt() {
  return stylesByTheme[useThemeName()];
}
