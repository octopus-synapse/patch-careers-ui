/** Change the interface immediately, then sync preference and web URL. */

import {
  type GetV1UsersPreferencesFullQueryResponse,
  getV1UsersPreferencesFullQueryKey,
  usePatchV1UsersPreferencesFull,
} from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { useToast } from "@patch-careers/ui";
import { useQueryClient } from "@tanstack/react-query";
import { type Href, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { Platform } from "react-native";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { GUEST_LOCALE_CHOICE_KEY } from "./route-locale";
import { twinPath } from "./twin-path";

export function useLocaleSwitch(): (target: Locale) => Promise<boolean> {
  const { locale, setLocale, t } = useI18n();
  const { isAuthenticated } = useAuthState();
  const pathname = usePathname();
  const router = useRouter();
  const patch = usePatchV1UsersPreferencesFull();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useCallback(
    async (target: Locale) => {
      // Change the visible interface first. Persisting the account preference
      // is best-effort and must never make the language control look broken.
      setLocale(target);

      if (Platform.OS === "web" && !isAuthenticated) {
        try {
          localStorage.setItem(GUEST_LOCALE_CHOICE_KEY, target);
        } catch {
          /* unavailable */
        }
      }
      if (isAuthenticated) {
        try {
          await patch.mutateAsync({ data: { language: target } });
          queryClient.setQueryData<GetV1UsersPreferencesFullQueryResponse>(
            getV1UsersPreferencesFullQueryKey(),
            (previous) =>
              previous
                ? {
                    ...previous,
                    preferences: { ...previous.preferences, language: target },
                  }
                : previous,
          );
          void queryClient.invalidateQueries({ queryKey: getV1UsersPreferencesFullQueryKey() });
        } catch {
          toast.show({ title: t("settings.preferences.languageSaveFailed"), intent: "danger" });
        }
      }
      if (Platform.OS !== "web" || target === locale) return true;
      const search = typeof window !== "undefined" ? window.location.search : "";
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const twin = twinPath(pathname, target, search, hash);
      if (twin !== `${pathname}${search}${hash}`) router.replace(twin as Href);
      return true;
    },
    [locale, setLocale, isAuthenticated, patch, queryClient, toast, t, pathname, router],
  );
}
