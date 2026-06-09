/**
 * Generic section form — maps a list of `SectionField`s to staggered field
 * controls, bound to a React Hook Form `control` (ADR-0005). Each field is a
 * Controller around the shared FieldRenderer, so validation + state come from
 * RHF while the rendered control stays the editorial one. This is the section
 * editor / profile sheets form (no location/phone special cases — the wizard's
 * StepForm keeps those, store-backed).
 */
import { AnimatedField } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { View } from "react-native";
import { ed } from "../lib/styles";
import type { SectionField } from "../types";
import { FieldRenderer } from "./field-renderer";

export function SectionForm<T extends FieldValues>({
  control,
  fields,
}: {
  control: Control<T>;
  fields: SectionField[];
}): ReactElement {
  return (
    <View style={ed.fieldStack}>
      {fields.map((field, index) => (
        <AnimatedField key={field.key} delay={120 + index * 70}>
          <Controller
            control={control}
            name={field.key as FieldPath<T>}
            render={({ field: rhf, fieldState }) => (
              <FieldRenderer
                field={field}
                value={String(rhf.value ?? "")}
                {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
                onChange={rhf.onChange}
              />
            )}
          />
        </AnimatedField>
      ))}
    </View>
  );
}
