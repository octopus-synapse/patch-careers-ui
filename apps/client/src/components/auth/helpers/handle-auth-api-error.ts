import type { Locale, Translator } from "@patch-careers/i18n";
import { type AuthFieldErrors, extractApiErrorMessages } from "../validation";

/** Minimal shape of the toast controller this helper needs. */
type ToastLike = { show: (options: { title: string; intent: "danger" }) => void };

export interface HandleAuthApiErrorOptions {
  locale: Locale;
  t: Translator;
  toast: ToastLike;
  setFieldErrors: (fields: AuthFieldErrors) => void;
  /** i18n key for the generic toast title when no specific code resolves. */
  fallbackKey: string;
}

/**
 * Turns a backend auth rejection into inline field errors, or a danger
 * toast when the error has no field to live under (ACCOUNT_LOCKED, network).
 * Never both — the message under the input is the whole feedback.
 */
export function handleAuthApiError(err: unknown, options: HandleAuthApiErrorOptions): void {
  const { locale, t, toast, setFieldErrors, fallbackKey } = options;
  const { toast: title, fields } = extractApiErrorMessages(err, locale, t, fallbackKey);
  if (Object.keys(fields).length > 0) setFieldErrors(fields);
  if (title) toast.show({ title, intent: "danger" });
}
