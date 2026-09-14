/**
 * <AccountLanguageSync> — keeps the interface language and the account's
 * `UserPreferences.language` in step (decision 5).
 *
 * Two directions, both quiet:
 *  - Adopt: on a device with NO saved choice, a signed-in person gets the
 *    language their account already knows. A saved choice on this device
 *    stays — the device is the more recent signal there.
 *  - Write-through: when the language changes while signed in, the account
 *    learns it, so e-mails and notifications arrive in that language and
 *    the next device starts right.
 *
 * Renders nothing. Mounted once, inside the auth provider.
 */

import {
  getV1UsersPreferencesFullQueryKey,
  useGetV1UsersPreferencesFull,
  usePatchV1UsersPreferencesFull,
} from "@patch-careers/api-client";
import { isLocale } from "@patch-careers/i18n";
import { LOCALE_STORE_KEY } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export function AccountLanguageSync(): null {
  const { isAuthenticated } = useAuthState();
  const { locale, setLocale, hydrated } = useI18n();
  const queryClient = useQueryClient();
  const prefs = useGetV1UsersPreferencesFull({
    query: { enabled: isAuthenticated, staleTime: 5 * 60_000 },
  });
  const patch = usePatchV1UsersPreferencesFull();
  const accountLanguage = prefs.data?.preferences.language;
  const adopted = useRef(false);

  // Adopt, once per sign-in, only when this device never chose.
  useEffect(() => {
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

  return null;
}
