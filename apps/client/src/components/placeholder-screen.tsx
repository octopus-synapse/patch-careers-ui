import type { ReactElement } from "react";

/**
 * Generic placeholder screen used by every tab in PR #6.
 * Real per-tab screens land in PR #9-#18.
 */

import { palette } from "@patch-careers/tokens";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  readonly title: string;
}

export function PlaceholderScreen({ title }: Props): ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Tab placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.gray[50],
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: palette.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: palette.gray[500],
  },
});
