/**
 * Adapts a resume section's DB-driven `sectionType.definition` into the
 * `SectionField[]` the shared section editor consumes. Mirrors the backend's
 * `buildFieldsFromSectionDefinition` (onboarding.presenter.ts) so the Profile
 * editor offers the same fields/enums the server validates against.
 */
import type { SectionField } from "../types";

type RawFieldDefinition = {
  key?: string;
  type?: string;
  required?: boolean;
  /** Canonical SCREAMING_CASE values (fallback when no localized pairs). */
  enum?: string[];
  /** Locale-resolved {value,label} pairs the backend resolver injects. */
  options?: Array<{ value: string; label: string }>;
  /** Translated label flattened to the field root by the resolver. */
  label?: unknown;
  meta?: {
    label?: unknown;
    widget?: unknown;
    hidden?: unknown;
    enumName?: unknown;
  } | null;
};

function inferUiType(type: string | undefined, widget: unknown): string {
  if (type === "enum") return "select";
  if (type === "date") return "date";
  if (type === "number") return "number";
  if (type === "boolean") return "checkbox";
  if (widget === "textarea") return "textarea";
  return "text";
}

/** `definition` is typed `{ [k]: any }` by the SDK; we read its `fields` array.
 *  Expects the LOCALE-RESOLVED definition (label flattened to root, enum
 *  fields carrying `options` {value,label} pairs) so the output matches the
 *  onboarding session fields exactly — one shape for both flows. */
export function fieldsFromDefinition(definition: unknown): SectionField[] {
  const def = definition as { fields?: RawFieldDefinition[] } | null | undefined;
  const out: SectionField[] = [];
  for (const field of def?.fields ?? []) {
    // Skip composite fields (arrays/objects) the flat editor can't render.
    if (!field.key || field.type === "array" || field.type === "object") continue;
    const meta = (field.meta ?? {}) as {
      label?: unknown;
      widget?: unknown;
      hidden?: unknown;
      enumName?: unknown;
    };
    // Derived-only fields (e.g. companyDomain, roleSeniority) never render.
    if (meta.hidden === true) continue;
    // Prefer the resolver's localized pairs; fall back to raw enum values.
    const options = field.options ?? field.enum?.map((value) => ({ value, label: value }));
    out.push({
      key: field.key,
      type: inferUiType(field.type, meta.widget),
      label:
        typeof field.label === "string" && field.label
          ? field.label
          : typeof meta.label === "string"
            ? meta.label
            : field.key,
      required: field.required ?? false,
      ...(typeof meta.widget === "string" ? { widget: meta.widget } : {}),
      ...(typeof meta.enumName === "string" ? { enumName: meta.enumName } : {}),
      ...(options ? { options } : {}),
    });
  }
  return out;
}
