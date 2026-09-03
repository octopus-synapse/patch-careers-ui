/**
 * The bilingual write-through, seen from the client (backend ADR-003).
 *
 * `useTranslationStatus` — per-locale rollup the switcher decides on (missing
 * items mean "translate now"; stale ones mean "the worker will catch up").
 * `useTranslateNow` — runs the derivation inline for the first switch.
 * `useTranslationProgress` — the user's live SSE channel, one event per
 * section, so the switch can say "6/11 sections". `react-native-sse` because
 * the browser's `EventSource` cannot send an Authorization header and native
 * has no `EventSource` at all; it is one implementation for both.
 */

import {
  getApiClientRuntime,
  getV1ResumesResumeIdSectionsQueryKey,
  getV1ResumesResumeIdTranslationsQueryKey,
  useGetV1ResumesResumeIdTranslations,
  usePostV1ResumesResumeIdTranslationsLocale,
} from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import EventSource from "react-native-sse";

export type TranslationRunStatus = "running" | "completed" | "failed" | "skipped";
export type TranslationSkipReason = "flag-off" | "monthly-cap" | "provider-unavailable" | "error";

export type TranslationProgress = {
  resumeId: string;
  locale: string;
  done: number;
  total: number;
  status: TranslationRunStatus;
  reason?: TranslationSkipReason;
};

export type LocaleTranslationStatus = {
  locale: string;
  role: "canonical" | "derived";
  items: {
    total: number;
    current: number;
    stale: number;
    missing: number;
    manual: number;
    diverged: number;
  };
  prose: "current" | "stale" | "missing" | "manual" | "diverged" | "n/a";
};

export function useTranslationStatus(resumeId: string | undefined) {
  const query = useGetV1ResumesResumeIdTranslations(resumeId ?? "", {
    query: { enabled: Boolean(resumeId) },
  });
  const locales = (query.data?.locales ?? []) as LocaleTranslationStatus[];
  return {
    language: query.data?.language as Locale | undefined,
    locales,
    forLocale: (locale: Locale) => locales.find((entry) => entry.locale === locale) ?? null,
    isLoading: query.isLoading,
  };
}

/** True when switching to `locale` would show untranslated text — the case for "translate now". */
export function needsTranslation(status: LocaleTranslationStatus | null): boolean {
  if (!status || status.role === "canonical") return false;
  return status.items.missing > 0 || status.prose === "missing";
}

export function useTranslateNow() {
  const queryClient = useQueryClient();
  const mutation = usePostV1ResumesResumeIdTranslationsLocale({
    mutation: {
      onSettled: (_data, _error, variables) => {
        void queryClient.invalidateQueries({
          queryKey: getV1ResumesResumeIdTranslationsQueryKey(variables.resumeId),
        });
        // The sections query is keyed by locale too; invalidate every version.
        void queryClient.invalidateQueries({
          queryKey: [getV1ResumesResumeIdSectionsQueryKey(variables.resumeId)[0]],
        });
      },
    },
  });
  return {
    translateNow: (resumeId: string, locale: Locale) => mutation.mutateAsync({ resumeId, locale }),
    isTranslating: mutation.isPending,
  };
}

/**
 * Subscribes while `resumeId` is set; the latest progress event for that
 * résumé, or null. Completion invalidates the sections and status queries so
 * the page re-reads the derived text without a refresh. Reconnects on error
 * (the library backs off on its own); if the stream never connects the
 * translate-now response still lands, so nothing depends on it alone.
 */
export function useTranslationProgress(resumeId: string | undefined): TranslationProgress | null {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<TranslationProgress | null>(null);

  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    let source: EventSource | null = null;

    const connect = async (): Promise<void> => {
      const runtime = getApiClientRuntime();
      const auth = await runtime.getAuthHeader?.();
      if (cancelled || !auth) return;
      source = new EventSource(`${runtime.baseURL}/api/v1/translation/subscribe`, {
        headers: { Authorization: auth },
      });
      source.addEventListener("message", (event) => {
        if (!event.data) return;
        let parsed: TranslationProgress;
        try {
          parsed = JSON.parse(event.data) as TranslationProgress;
        } catch {
          return;
        }
        if (parsed.resumeId !== resumeId) return;
        setProgress(parsed);
        if (parsed.status !== "running") {
          void queryClient.invalidateQueries({
            queryKey: getV1ResumesResumeIdTranslationsQueryKey(resumeId),
          });
          void queryClient.invalidateQueries({
            queryKey: [getV1ResumesResumeIdSectionsQueryKey(resumeId)[0]],
          });
        }
      });
    };
    void connect();

    return () => {
      cancelled = true;
      source?.removeAllEventListeners();
      source?.close();
    };
  }, [resumeId, queryClient]);

  return progress;
}
