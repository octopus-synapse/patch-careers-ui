/**
 * `useContentLocale` — which language VERSION of a résumé a screen shows and
 * edits, and the switch between the two (ADR-0011, decisions 9–10).
 *
 * The other version should already exist (created after onboarding, or by
 * the worker after every change). When it does not — an account from
 * before, or a brake that held — the first switch derives it now and the
 * caller shows the run section by section (ADR-003 §10). The switch itself
 * never blocks: a missing or stale version reads as the canonical text with
 * a mark until the run lands.
 */
import type { Locale } from "@patch-careers/i18n";
import { useI18n } from "@/providers/i18n-provider";
import { resumeLanguageToLocale } from "../lib/helpers";
import { useContentLocaleStore } from "../model/content-locale.store";
import {
  type LocaleTranslationStatus,
  needsTranslation,
  type TranslationProgress,
  useTranslateNow,
  useTranslationProgress,
  useTranslationStatus,
} from "./use-resume-translation";

export interface ContentLocaleState {
  /** The version being shown — the override, else the résumé's own language. */
  readonly content: Locale;
  /** The language the résumé was written in. */
  readonly canonical: Locale;
  /** Rollup for the shown version (null for the canonical one or while loading). */
  readonly status: LocaleTranslationStatus | null;
  /** The latest live event of a translation run for this résumé. */
  readonly progress: TranslationProgress | null;
  readonly switchTo: (next: Locale) => void;
}

export function useContentLocale(
  resumeId: string | undefined,
  language: string | null | undefined,
): ContentLocaleState {
  const { locale: uiLocale } = useI18n();
  const override = useContentLocaleStore((s) =>
    resumeId ? (s.overrides[resumeId] ?? null) : null,
  );
  const setOverride = useContentLocaleStore((s) => s.setOverride);
  const canonical: Locale = resumeLanguageToLocale(language) ?? uiLocale;
  const content: Locale = override ?? canonical;
  const status = useTranslationStatus(resumeId);
  const progress = useTranslationProgress(resumeId);
  const { translateNow } = useTranslateNow();

  const switchTo = (next: Locale): void => {
    if (!resumeId) return;
    setOverride(resumeId, next);
    if (needsTranslation(status.forLocale(next))) {
      translateNow(resumeId, next).catch(() => undefined); // the caller's caption reports the outcome
    }
  };

  return {
    content,
    canonical,
    status: status.forLocale(content),
    progress,
    switchTo,
  };
}
