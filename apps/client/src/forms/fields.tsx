/**
 * RHF Controller adapters for the editorial auth fields (ADR-0005).
 *
 * They bind the existing DS fields (AuthEmailField/AuthPasswordField) to a
 * React Hook Form `control`, so forms get validation + state from RHF while
 * the rendered field stays the same Editorial Calm component.
 */
import type { ReactElement } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { AuthEmailField, AuthPasswordField } from "@/components/auth/fields";

type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  testID: string;
  onSubmitEditing?: () => void;
};

export function FormEmailField<T extends FieldValues>({
  control,
  name,
  testID,
  onSubmitEditing,
}: BaseFieldProps<T>): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AuthEmailField
          value={String(field.value ?? "")}
          onChangeText={field.onChange}
          error={fieldState.error?.message}
          testID={testID}
          {...(onSubmitEditing ? { onSubmitEditing } : {})}
        />
      )}
    />
  );
}

export function FormPasswordField<T extends FieldValues>({
  control,
  name,
  testID,
  onSubmitEditing,
  isNew,
  label,
}: BaseFieldProps<T> & { isNew?: boolean; label?: string }): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AuthPasswordField
          value={String(field.value ?? "")}
          onChangeText={field.onChange}
          error={fieldState.error?.message}
          testID={testID}
          {...(isNew !== undefined ? { isNew } : {})}
          {...(label !== undefined ? { label } : {})}
          {...(onSubmitEditing ? { onSubmitEditing } : {})}
        />
      )}
    />
  );
}
