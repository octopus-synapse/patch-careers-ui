import type { AuthMascotController } from "@patch-careers/ui/editorial";
import { useMemo } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

type TextBindings = { onFocus: () => void; onBlur: () => void; onCaretChange: (i: number) => void };
type PasswordBindings = {
  onFocus: () => void;
  onBlur: () => void;
  onVisibilityChange: (visible: boolean) => void;
};

/**
 * Wires the auth mascot to a React Hook Form: returns the observer props
 * each field needs so the mascot follows the caret, covers its eyes on the
 * password, grimaces on an invalid blur, and so on. Values are read with
 * `getValues` at event time — no `watch` subscriptions, no re-renders.
 */
export function useMascotForm<T extends FieldValues>(
  mascot: AuthMascotController,
  form: UseFormReturn<T>,
): {
  text: (field: "name" | "email", name: Path<T>) => TextBindings;
  password: (name: Path<T>) => PasswordBindings;
} {
  return useMemo(
    () => ({
      text: (field, name) => ({
        onFocus: () => mascot.onTextFieldFocus(field),
        onBlur: () => mascot.onTextFieldBlur(field, String(form.getValues(name) ?? "")),
        onCaretChange: (i) => mascot.onTextFieldCaret(field, String(form.getValues(name) ?? ""), i),
      }),
      password: (name) => ({
        onFocus: mascot.onPasswordFocus,
        onBlur: () => mascot.onPasswordBlur(String(form.getValues(name) ?? "")),
        onVisibilityChange: mascot.onPasswordVisibility,
      }),
    }),
    [mascot, form],
  );
}
