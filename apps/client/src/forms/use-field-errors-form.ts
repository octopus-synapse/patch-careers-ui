/**
 * useForm preset for validators that return a `{ field: message }` map
 * (the auth validators, dynamic section forms). Same `onTouched` policy as
 * `useZodForm`, so every form in the app validates on the same trigger.
 */
import { type FieldValues, type UseFormProps, useForm } from "react-hook-form";
import { fieldErrorsResolver } from "./resolver";

export function useFieldErrorsForm<T extends FieldValues>(
  validate: (values: T) => Partial<Record<keyof T & string, string | undefined>> | null,
  options?: Omit<UseFormProps<T>, "resolver">,
) {
  return useForm<T>({ mode: "onTouched", ...options, resolver: fieldErrorsResolver<T>(validate) });
}
