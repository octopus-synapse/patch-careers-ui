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
  payload?: { email?: string; password?: string };
}

/**
 * Turns a backend auth rejection into a toast + inline field errors —
 * the catch block sign-in and sign-up were copy-pasting. Surfaces inline
 * field errors when the backend returns `fields[]`, and always shows a
 * danger toast with the resolved title.
 */
export function handleAuthApiError(err: unknown, options: HandleAuthApiErrorOptions): void {
  const { locale, t, toast, setFieldErrors, fallbackKey, payload } = options;
  const { toast: title, fields } = extractApiErrorMessages(err, locale, t, fallbackKey, payload);
  if (Object.keys(fields).length > 0) setFieldErrors(fields);
  toast.show({ title, intent: "danger" });
}
