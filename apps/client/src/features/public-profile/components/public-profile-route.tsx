/**
 * <PublicProfileRoute> — the body shared by `/u/[username]` and its English
 * twin `/en/u/[username]`. The route file says which language version it is;
 * everything else (full-bleed scene, `@handle` → `handle`) is the same.
 */
import type { Locale } from "@patch-careers/i18n";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Stack, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { PublicProfileScreen } from "./public-profile-screen";

export function PublicProfileRoute({ locale }: { locale: Locale }): ReactElement {
  const palette = useEditorialPalette();
  const params = useLocalSearchParams<{ username: string }>();
  const raw = Array.isArray(params.username) ? params.username[0] : params.username;
  const username = raw?.trim();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: palette.bg,
            width: "100%",
            maxWidth: undefined,
            alignSelf: "stretch",
          },
        }}
      />
      {/* `@maria` and `maria` are the same person; the API takes the bare handle. */}
      <PublicProfileScreen
        username={username ? username.replace(/^@/, "") : undefined}
        locale={locale}
      />
    </>
  );
}
