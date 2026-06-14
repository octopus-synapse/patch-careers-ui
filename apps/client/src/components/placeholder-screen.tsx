import type { ReactElement } from "react";

/**
 * Generic placeholder screen used by every tab in PR #6.
 * Real per-tab screens land in PR #9-#18.
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { useThemeName } from "@patch-careers/ui";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

interface Props {
  readonly title: string;
}

export function PlaceholderScreen({ title }: Props): ReactElement {
  const { t } = useI18n();
  const styles = stylesByTheme[useThemeName()];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{t("app.placeholderScreen.subtitle")}</Text>
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.bg,
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "600",
      color: p.ink,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: p.muted,
    },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
