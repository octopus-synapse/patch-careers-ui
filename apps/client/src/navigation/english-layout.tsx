import { Stack } from "expo-router";
import type { ReactElement } from "react";
import { useSceneContentStyle } from "@/hooks/use-scene-content-style";

/** Generated /en aliases share the same screens and navigation groups. */
export default function EnglishLayout(): ReactElement {
  const contentStyle = useSceneContentStyle();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: "#F2F1EC", width: "100%", alignSelf: "stretch" } }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ contentStyle: { width: "100%", alignSelf: "stretch" } }} />
      <Stack.Screen name="u/[username]" options={{ contentStyle: { width: "100%", alignSelf: "stretch" } }} />
    </Stack>
  );
}
