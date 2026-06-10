/**
 * Generic section form — maps a list of `SectionField`s to staggered field
 * controls, bound to a React Hook Form `control` (ADR-0005). Each field is a
 * Controller around the shared FieldRenderer, so validation + state come from
 * RHF while the rendered control stays the editorial one. This is the section
 * editor / profile sheets form (no location/phone special cases — the wizard's
 * StepForm keeps those, store-backed).
 *
 * Every section unlocks its fields strictly in order — field N is interactive
 * only once every previous *blocking* field holds a value. Required fields and
 * one-tap selects (employment type, level…) block; optional free-text fields
 * don't, so a skippable URL/description never dead-ends the chain, and an
 * empty endDate keeps meaning "Present". Education extras (gated on the
 * section having an `institution` field): course suggestions scoped to the
 * institution, and `readOnlyKeys` fields (degree/degreeType derived from the
 * picked MEC course) render their value but don't accept input.
 */
import { AnimatedField } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  useWatch,
} from "react-hook-form";
import { View } from "react-native";
import { useEd } from "../lib/styles";
import type { SectionField } from "../types";
import type { PickedCompany } from "./company-picker";
import type { PickedCourse } from "./course-picker";
import { FieldRenderer } from "./field-renderer";

/** Fields whose empty value is a deliberate state, not "not filled yet". */
const GATE_EXEMPT_KEYS = new Set(["endDate"]);

/** Whether an unfilled `field` holds back the fields after it. */
function blocksChain(field: SectionField): boolean {
  if (GATE_EXEMPT_KEYS.has(field.key)) return false;
  return field.required || field.type === "select" || Boolean(field.options?.length);
}

export function SectionForm<T extends FieldValues>({
  control,
  fields,
  readOnlyKeys,
  onCompanyPick,
  onCoursePick,
}: {
  control: Control<T>;
  fields: SectionField[];
  /** Keys rendered as non-editable derived values (e.g. degree from MEC). */
  readOnlyKeys?: ReadonlySet<string> | undefined;
  /** Bubbles the company picker's pick up so the editor syncs the domain. */
  onCompanyPick?: ((company: PickedCompany | null) => void) | undefined;
  /** Bubbles the course picker's pick up so the editor can derive fields. */
  onCoursePick?: ((course: PickedCourse | null) => void) | undefined;
}): ReactElement {
  const ed = useEd();
  // Live values drive the sequential unlock chain (every section) and the
  // institution → course scoping (education only).
  const hasInstitution = fields.some((field) => field.key === "institution");
  const values = useWatch({ control }) as Record<string, unknown>;
  const institutionName = hasInstitution ? String(values.institution ?? "") : undefined;

  const filled = (key: string): boolean => String(values[key] ?? "").trim().length > 0;
  const unlockedAt = (index: number): boolean =>
    fields.slice(0, index).every((field) => !blocksChain(field) || filled(field.key));

  return (
    <View style={ed.fieldStack}>
      {fields.map((field, index) => {
        const readOnly = readOnlyKeys?.has(field.key) ?? false;
        const unlocked = unlockedAt(index);
        return (
          <AnimatedField key={field.key} delay={120 + index * 70}>
            <View
              pointerEvents={unlocked && !readOnly ? "auto" : "none"}
              style={unlocked ? null : ed.gatedField}
            >
              <Controller
                control={control}
                name={field.key as FieldPath<T>}
                render={({ field: rhf, fieldState }) => (
                  <FieldRenderer
                    field={field}
                    value={String(rhf.value ?? "")}
                    institutionName={institutionName}
                    onCompanyPick={field.key === "company" ? onCompanyPick : undefined}
                    onCoursePick={field.key === "field" ? onCoursePick : undefined}
                    {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
                    onChange={rhf.onChange}
                  />
                )}
              />
            </View>
          </AnimatedField>
        );
      })}
    </View>
  );
}
