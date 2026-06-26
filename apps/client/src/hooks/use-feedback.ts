/**
 * `useFeedback` — the one entry point for ephemeral user feedback.
 *
 * Wraps `useToast` from `@patch-careers/ui` with a small, semantic API
 * (`success` / `warning` / `info` / `error`) so call sites never repeat the
 * "resolve a backend code → pick a toast intent → show it" dance. The
 * `error` helper runs the feature-agnostic `extractErrorMessage`
 * (contracts dictionary → backend message → i18n fallback), which is the
 * DRY backbone every mutation's `onError` should call.
 */

import { type ToastIntent, useToast } from "@patch-careers/ui";
import { useMemo } from "react";
import { extractErrorMessage } from "@/lib/errors/backend-error";
import { useI18n } from "@/providers/i18n-provider";

export type FeedbackIntent = "error" | "warning" | "success" | "info";

export interface NotifyOptions {
  intent: FeedbackIntent;
  title: string;
  message?: string;
  durationMs?: number;
}

/** Semantic intents → the toast surface's visual/haptic intents. */
const TOAST_INTENT: Record<FeedbackIntent, ToastIntent> = {
  error: "danger",
  warning: "accent",
  success: "success",
  info: "neutral",
};

export interface Feedback {
  notify: (options: NotifyOptions) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  /**
   * Surface any fetcher rejection as a danger toast. `fallbackKey` is the
   * i18n key used when the backend returns no resolvable code/message.
   */
  error: (err: unknown, fallbackKey: string) => void;
}

export function useFeedback(): Feedback {
  const toast = useToast();
  const { locale, t } = useI18n();

  return useMemo<Feedback>(() => {
    const notify = ({ intent, title, message, durationMs }: NotifyOptions): void => {
      toast.show({
        title,
        intent: TOAST_INTENT[intent],
        ...(message ? { message } : {}),
        ...(durationMs ? { durationMs } : {}),
      });
    };
    return {
      notify,
      success: (title, message) =>
        notify({ intent: "success", title, ...(message ? { message } : {}) }),
      warning: (title, message) =>
        notify({ intent: "warning", title, ...(message ? { message } : {}) }),
      info: (title, message) => notify({ intent: "info", title, ...(message ? { message } : {}) }),
      error: (err, fallbackKey) =>
        notify({ intent: "error", title: extractErrorMessage(err, locale, t, fallbackKey) }),
    };
  }, [toast, locale, t]);
}
