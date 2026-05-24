/**
 * Shared "centered card + logo on top" frame used by every screen in
 * the (auth) group. Encapsulates the D91 layout decision so individual
 * screens stay focused on their form content.
 *
 * On wide viewports (web) the card is constrained to 400px and
 * vertically centered; on mobile the card fills the safe area and the
 * keyboard is allowed to push the form upward via KeyboardAvoidingView.
 */

import { palette } from "@patch-careers/tokens";
import { Text } from "@patch-careers/ui";
import type { ReactElement, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  readonly children: ReactNode;
  readonly title?: string | undefined;
  readonly subtitle?: string | undefined;
}

export function AuthScreenLayout({ children, title, subtitle }: Props): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.brand}>
              <View accessibilityLabel="Patch Careers" style={styles.logoSquare} />
              <Text preset="h2">Patch Careers</Text>
            </View>
            {title ? (
              <View style={styles.header}>
                <Text preset="h2" style={styles.title}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text preset="caption" color="$gray10" style={styles.subtitle}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.gray[50],
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  brand: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logoSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: palette.blue[600],
  },
  header: {
    gap: 4,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
});
