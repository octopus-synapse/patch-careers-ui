import type { Locale, Translator } from "@patch-careers/i18n";
import { useToast } from "@patch-careers/ui";
import { useRouter } from "expo-router";
import { useI18n } from "../../../providers/I18nProvider";

type Router = ReturnType<typeof useRouter>;
type Toast = ReturnType<typeof useToast>;

/**
 * One-call setup for the auth screens — bundles the translator (+ locale,
 * needed by `handleAuthApiError`), the router and the toast controller
 * that every screen otherwise pulls in separately.
 */
export function useAuthScreen(): {
  t: Translator;
  locale: Locale;
  router: Router;
  toast: Toast;
} {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  return { t, locale, router, toast };
}
