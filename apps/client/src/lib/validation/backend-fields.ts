/**
 * Backend `fields[]` → per-field inline messages.
 *
 * The API's error envelope (`ErrorResponse`) carries
 * `fields: [{ path, code, params, message }]` for request validation and
 * for domain rules with per-field detail (e.g. PASSWORD_WEAK → one entry
 * per failed rule). `message` is already localized by the server via
 * `Accept-Language`, so it is rendered verbatim; the generated
 * `DICTIONARIES.validation` is the fallback for older envelopes that only
 * carry a code.
 */

import { translateValidationCode } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { asRecord, extractBackendPayload, messageFromUnknown } from "@/lib/errors/backend-error";

export interface BackendFieldError {
  readonly path: ReadonlyArray<string | number>;
  readonly code?: string;
  readonly params?: Readonly<Record<string, string | number | boolean | null>>;
  readonly message?: string;
}

function pathFromUnknown(raw: unknown): ReadonlyArray<string | number> | null {
  if (Array.isArray(raw)) {
    const segments = raw.filter(
      (s): s is string | number => typeof s === "string" || typeof s === "number",
    );
    return segments.length > 0 ? segments : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    // Legacy dotted/bracket paths: "items[0].url" → ["items", "0", "url"].
    return raw.split(/[.[\]]+/).filter(Boolean);
  }
  return null;
}

function paramsFromUnknown(
  raw: unknown,
): Readonly<Record<string, string | number | boolean | null>> | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      out[k] = v as string | number | boolean | null;
    }
  }
  return out;
}

/** Normalises one `fields`/`details`/`errors` array; `null` when it isn't one. */
export function backendFieldsFromUnknown(value: unknown): BackendFieldError[] | null {
  if (!Array.isArray(value)) return null;
  const fields: BackendFieldError[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record) continue;
    const path = pathFromUnknown(record.path ?? record.field ?? record.property);
    if (!path) continue;
    const code = typeof record.code === "string" ? record.code : undefined;
    const params = paramsFromUnknown(record.params);
    const message = messageFromUnknown(record.message) ?? messageFromUnknown(record.constraints);
    fields.push({
      path,
      ...(code ? { code } : {}),
      ...(params ? { params } : {}),
      ...(message ? { message } : {}),
    });
  }
  return fields.length > 0 ? fields : null;
}

/** Key used to address a field error: string path segments joined by `.`. */
export function fieldKeyOf(path: ReadonlyArray<string | number>): string {
  return path.map(String).join(".");
}

/** Server message first (already localized), then the shipped dictionary. */
export function backendFieldMessage(field: BackendFieldError, locale: Locale): string | undefined {
  if (field.message) return field.message;
  if (field.code) return translateValidationCode(field.code, locale, field.params ?? {});
  return undefined;
}

/**
 * Walks a fetcher rejection down to `{ [fieldKey]: message }`. Empty object
 * when the response carries no per-field detail. First entry per key wins
 * (the backend lists issues in rule order, most useful first).
 */
export function fieldErrorsFromResponse(err: unknown, locale: Locale): Record<string, string> {
  const data = extractBackendPayload(err);
  const fields =
    backendFieldsFromUnknown(data.fields) ??
    backendFieldsFromUnknown(data.details) ??
    backendFieldsFromUnknown(data.errors) ??
    [];
  const out: Record<string, string> = {};
  for (const field of fields) {
    const key = fieldKeyOf(field.path);
    if (out[key]) continue;
    const message = backendFieldMessage(field, locale);
    if (message) out[key] = message;
  }
  return out;
}
