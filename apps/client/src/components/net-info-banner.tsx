/**
 * Sticky offline banner shown when the device reports no connectivity
 * (D23 — react-native-netinfo + auto pause queries). Renders nothing
 * when online so it doesn't take vertical space.
 *
 * Visual: 32px-tall pill in the danger color, anchored under the
 * status bar via SafeAreaView insets.
 */

import { palette } from "@patch-careers/tokens";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { type ReactElement, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslator } from "@/providers/i18n-provider";

export function NetInfoBanner(): ReactElement | null {
  const insets = useSafeAreaInsets();
  const t = useTranslator();
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state: NetInfoState) => {
      // `isInternetReachable` can be null briefly during boot; treat
      // null as "online" to avoid a flicker on app start.
      const reachable = state.isInternetReachable ?? true;
      setOnline(Boolean(state.isConnected) && reachable);
    });
    return () => sub();
  }, []);

  if (online) return null;

  // Web doesn't have status bar insets; use a flat 0.
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={[styles.banner, { paddingTop: topPad + 6 }]} accessibilityRole="alert">
      <Text style={styles.text}>{t("common.error")} — offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: palette.red[600],
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  text: {
    color: palette.gray[50],
    fontWeight: "600",
    fontSize: 14,
  },
});
