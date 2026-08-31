/**
 * RHF Controller adapters for the editorial auth fields (ADR-0005).
 *
 * They bind the existing DS fields (AuthEmailField/AuthPasswordField) to a
 * React Hook Form `control`, so forms get validation + state from RHF while
 * the rendered field stays the same Editorial Calm component.
 */
import type { ReactElement, ReactNode, Ref } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import type { ReturnKeyTypeOptions, TextInput } from "react-native";
import {
  AuthEmailField,
  AuthNameField,
  AuthPasswordField,
  type FieldObservers,
} from "@/components/auth/fields";

type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  testID: string;
  onSubmitEditing?: () => void;
} & FieldObservers;

function pick(o: FieldObservers): FieldObservers {
  return {
    ...(o.onFocus ? { onFocus: o.onFocus } : {}),
    ...(o.onBlur ? { onBlur: o.onBlur } : {}),
    ...(o.onCaretChange ? { onCaretChange: o.onCaretChange } : {}),
  };
}

export function FormNameField<T extends FieldValues>({
  control,
  name,
  testID,
  onSubmitEditing,
  ...observers
}: BaseFieldProps<T>): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AuthNameField
          value={String(field.value ?? "")}
          onChangeText={field.onChange}
          error={fieldState.error?.message}
          testID={testID}
          {...(onSubmitEditing ? { onSubmitEditing } : {})}
          {...pick(observers)}
        />
      )}
    />
  );
}

export function FormEmailField<T extends FieldValues>({
  control,
  name,
  testID,
  inputRef,
  onSubmitEditing,
  ...observers
}: BaseFieldProps<T> & { inputRef?: Ref<TextInput> }): ReactElement {
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
          {...(inputRef ? { inputRef } : {})}
          {...(onSubmitEditing ? { onSubmitEditing } : {})}
          {...pick(observers)}
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
  inputRef,
  returnKeyType,
  children,
  onVisibilityChange,
  ...observers
}: BaseFieldProps<T> & {
  isNew?: boolean;
  label?: string;
  inputRef?: Ref<TextInput>;
  returnKeyType?: ReturnKeyTypeOptions;
  children?: ReactNode;
  onVisibilityChange?: (visible: boolean) => void;
}): ReactElement {
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
          {...(inputRef ? { inputRef } : {})}
          {...(returnKeyType ? { returnKeyType } : {})}
          {...(isNew !== undefined ? { isNew } : {})}
          {...(label !== undefined ? { label } : {})}
          {...(onSubmitEditing ? { onSubmitEditing } : {})}
          {...(onVisibilityChange ? { onVisibilityChange } : {})}
          {...pick(observers)}
        >
          {children}
        </AuthPasswordField>
      )}
    />
  );
}
