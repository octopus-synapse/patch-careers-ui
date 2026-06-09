/**
 * Generic section form — maps a list of `SectionField`s to staggered field
 * controls. This is the wizard's `StepForm` without the location/phone special
 * cases (no section item uses those keys), so it carries no extra dependencies
 * and is what the item editor renders for work experience / education / etc.
 */
import { AnimatedField } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ed } from "../lib/styles";
import type { FormData, SectionField } from "../types";
import { FieldRenderer } from "./field-renderer";

export function SectionForm({
  data,
  errors,
  fields,
  onChange,
}: {
  data: FormData;
  errors: Record<string, string>;
  fields: SectionField[];
  onChange: (data: FormData) => void;
}): ReactElement {
  return (
    <View style={ed.fieldStack}>
      {fields.map((field, index) => {
        const fieldError = errors[field.key];
        return (
          <AnimatedField key={field.key} delay={120 + index * 70}>
            <FieldRenderer
              field={field}
              value={data[field.key] ?? ""}
              {...(fieldError ? { error: fieldError } : {})}
              onChange={(value) => onChange({ ...data, [field.key]: value })}
            />
          </AnimatedField>
        );
      })}
    </View>
  );
}
