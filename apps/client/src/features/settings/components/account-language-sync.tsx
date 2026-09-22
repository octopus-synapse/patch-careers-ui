/** Account preference chooses the signed-in web URL. Native retains its
 * persisted choice and account write-through behavior. */

import {
  getV1UsersPreferencesFullQueryKey,
  useGetV1UsersPreferencesFull,
  usePatchV1UsersPreferencesFull,
} from "@patch-careers/api-client";
import { isLocale } from "@patch-careers/i18n";
import { LOCALE_STORE_KEY } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { type Href, usePathname, useRouter } from "expo-router";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GUEST_LOCALE_CHOICE_KEY, localeFromPath } from "@/navigation/route-locale";
import { twinPath } from "@/navigation/twin-path";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { localeFromLanguageTag, useI18n } from "@/providers/i18n-provider";
import { GuestLanguageDialog } from "./guest-language-dialog";

export function AccountLanguageSync(): ReactElement | null {
  const { isAuthenticated } = useAuthState();
  const { hasBootstrapped } = useAuthBootstrap();
  const { locale, setLocale, hydrated } = useI18n();
  const palette = useEditorialPalette();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefs = useGetV1UsersPreferencesFull({
    query: { enabled: isAuthenticated, staleTime: 5 * 60_000 },
  });
  const patch = usePatchV1UsersPreferencesFull();
  const accountLanguage = prefs.data?.preferences.language;
  const adopted = useRef(false);
  const [confirmGuestLanguage, setConfirmGuestLanguage] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || !hasBootstrapped) return;
    const search = window.location.search;
    const hash = window.location.hash;
    if (isAuthenticated) {
      if (!prefs.isSuccess) return;
      const preferred = isLocale(accountLanguage) ? accountLanguage : "pt-BR";
      if (localeFromPath(pathname) !== preferred) {
        router.replace(twinPath(pathname, preferred, search, hash) as Href);
      }
      return;
    }
    // A returning guest's choice applies at the entry page. Explicit links
    // retain the language encoded in their URL.
    let chosen: string | null = null;
    try {
      chosen = localStorage.getItem(GUEST_LOCALE_CHOICE_KEY);
    } catch {
      /* The dialog still works for this visit. */
    }
    if (isLocale(chosen)) {
      setConfirmGuestLanguage(false);
      if (pathname === "/" && chosen === "en")
        router.replace(twinPath(pathname, chosen, search, hash) as Href);
      return;
    }
    if (localeFromLanguageTag(navigator.language) === "en" && localeFromPath(pathname) !== "en") {
      router.replace(twinPath(pathname, "en", search, hash) as Href);
      return;
    }
    setConfirmGuestLanguage(true);
  }, [hasBootstrapped, isAuthenticated, prefs.isSuccess, accountLanguage, pathname, router]);

  // Adopt, once per sign-in, only when this device never chose.
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!isAuthenticated) {
      adopted.current = false;
      return;
    }
    if (adopted.current || !hydrated || !isLocale(accountLanguage)) return;
    adopted.current = true;
    let cancelled = false;
    mundane
      .getItem(LOCALE_STORE_KEY)
      .then((stored) => {
        if (cancelled || isLocale(stored)) return;
        if (accountLanguage !== locale) setLocale(accountLanguage);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hydrated, accountLanguage, locale, setLocale]);

  // Write-through: the interface moved and the account is behind.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `patch`/`queryClient` are stable; listing `patch` would re-fire on every mutation state change.
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!isAuthenticated || !adopted.current || !isLocale(accountLanguage)) return;
    if (accountLanguage === locale || patch.isPending) return;
    patch.mutate(
      { data: { language: locale } },
      {
        onSuccess: () =>
          void queryClient.invalidateQueries({ queryKey: getV1UsersPreferencesFullQueryKey() }),
      },
    );
  }, [isAuthenticated, accountLanguage, locale]);

  const waitingForAccountLocale =
    Platform.OS === "web" &&
    hasBootstrapped &&
    isAuthenticated &&
    !prefs.isError &&
    (!prefs.isSuccess ||
      (isLocale(accountLanguage) && accountLanguage !== localeFromPath(pathname)));
  if (waitingForAccountLocale)
    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 10000,
          backgroundColor: palette.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  return Platform.OS === "web" && hasBootstrapped && !isAuthenticated && confirmGuestLanguage ? (
    <GuestLanguageDialog onConfirm={() => setConfirmGuestLanguage(false)} />
  ) : null;
}
