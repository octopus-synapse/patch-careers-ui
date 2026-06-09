/**
 * Adapts a resume section's DB-driven `sectionType.definition` into the
 * `SectionField[]` the shared section editor consumes. Mirrors the backend's
 * `buildFieldsFromSectionDefinition` (onboarding.presenter.ts) so the Profile
 * editor offers the same fields/enums the server validates against.
 */
import type { SectionField } from "@/features/sections";

type RawFieldDefinition = {
  key?: string;
  type?: string;
  required?: boolean;
  enum?: string[];
  meta?: { label?: unknown; widget?: unknown } | null;
};

function inferUiType(type: string | undefined, widget: unknown): string {
  if (type === "enum") return "select";
  if (type === "date") return "date";
  if (type === "number") return "number";
  if (type === "boolean") return "checkbox";
  if (widget === "textarea") return "textarea";
  return "text";
}

/** `definition` is typed `{ [k]: any }` by the SDK; we read its `fields` array. */
export function fieldsFromDefinition(definition: unknown): SectionField[] {
  const def = definition as { fields?: RawFieldDefinition[] } | null | undefined;
  const out: SectionField[] = [];
  for (const field of def?.fields ?? []) {
    // Skip composite fields (arrays/objects) the flat editor can't render.
    if (!field.key || field.type === "array" || field.type === "object") continue;
    const meta = (field.meta ?? {}) as { label?: unknown; widget?: unknown };
    out.push({
      key: field.key,
      type: inferUiType(field.type, meta.widget),
      label: typeof meta.label === "string" ? meta.label : field.key,
      required: field.required ?? false,
      ...(typeof meta.widget === "string" ? { widget: meta.widget } : {}),
      ...(field.enum ? { options: field.enum } : {}),
    });
  }
  return out;
}
