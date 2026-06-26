/**
 * Feature-agnostic backend-error plumbing.
 *
 * Walks whatever envelope a fetcher rejection carries (`response.data`,
 * `data`, `body`, or the error itself — stringified or nested under
 * `error`/`errors`) down to the `{ code, message, fields }` shape the API
 * actually returns, and resolves a single human, localized message:
 *   - `code` → `DICTIONARIES.errors[code]` (translated by the contracts
 *     pipeline, byte-for-byte with the backend);
 *   - else the backend `message`;
 *   - else a caller-supplied i18n fallback key.
 *
 * Auth's `validation.ts` builds its field-level (email/password) extraction
 * on top of these generics; everything else (mutations, queries) uses
 * `extractErrorMessage` for a toast string.
 */

import { DICTIONARIES } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";

export type BackendField = { path?: string | string[]; code?: string; message?: string };

export interface BackendErrorPayload {
  code?: unknown;
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  details?: unknown;
  fields?: BackendField[];
}

export interface FetcherErrorLike {
  response?: { data?: BackendErrorPayload };
  data?: unknown;
  body?: unknown;
  message?: string;
  code?: string;
}

/**
 * Looks up `code` in the generated contracts dictionary (`errors.*`).
 * Falls back to the backend's `message`, then to a caller-supplied generic
 * fallback (e.g. `t("profile.edit.saveFailed")`).
 */
export function translateBackendCode(
  code: string | undefined,
  locale: Locale,
  fallback: string,
  backendMessage?: string,
): string {
  if (code) {
    const entry = (DICTIONARIES as { errors: Record<string, Record<Locale, string>> }).errors[code];
    if (entry?.[locale]) return entry[locale];
  }
  return backendMessage ?? code ?? fallback;
}

export function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toBackendPayload(value: unknown): BackendErrorPayload | null {
  const parsed = parseJsonLike(value);
  const record = asRecord(parsed);
  if (!record) return null;

  const nested = toBackendPayload(record.error) ?? toBackendPayload(record.errors);
  return {
    ...nested,
    ...(record as BackendErrorPayload),
  };
}

export function extractBackendPayload(err: unknown): BackendErrorPayload {
  const error = err as FetcherErrorLike;
  return (
    toBackendPayload(error.response?.data) ??
    toBackendPayload(error.data) ??
    toBackendPayload(error.body) ??
    toBackendPayload(err) ??
    {}
  );
}

export function messageFromUnknown(value: unknown): string | undefined {
  const parsed = parseJsonLike(value);
  if (typeof parsed === "string") return parsed;
  if (Array.isArray(parsed)) {
    const messages = parsed.map(messageFromUnknown).filter((v): v is string => Boolean(v));
    return messages.length > 0 ? messages.join("\n") : undefined;
  }
  const record = asRecord(parsed);
  if (!record) return undefined;
  const direct = record.message;
  if (typeof direct === "string") return direct;
  if (Array.isArray(direct)) return messageFromUnknown(direct);
  return messageFromUnknown(record.error) ?? messageFromUnknown(record.errors);
}

/**
 * Resolve a single human, localized toast message from any fetcher error.
 * Feature-agnostic — no per-field detail. `fallbackKey` is the i18n key for
 * the generic title when no code/message resolves.
 */
export function extractErrorMessage(
  err: unknown,
  locale: Locale,
  t: Translator,
  fallbackKey: string,
): string {
  const data = extractBackendPayload(err);
  const fallback = t(fallbackKey);
  const backendCode = typeof data.code === "string" ? data.code : undefined;
  const errorCode =
    typeof (err as FetcherErrorLike)?.code === "string"
      ? (err as FetcherErrorLike).code
      : undefined;
  const backendMessage =
    messageFromUnknown(data.message) ??
    messageFromUnknown(data.details) ??
    messageFromUnknown(data.errors) ??
    (err as FetcherErrorLike)?.message;
  return translateBackendCode(backendCode ?? errorCode, locale, fallback, backendMessage);
}
