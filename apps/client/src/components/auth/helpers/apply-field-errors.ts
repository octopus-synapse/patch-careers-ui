import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { AuthFieldErrors } from "@/components/auth/validation";

/**
 * Bridges backend field errors (from `handleAuthApiError`) onto a React Hook
 * Form: one `setError` per key the form actually owns.
 */
export function fieldErrorsSetter<T extends FieldValues>(
  form: UseFormReturn<T>,
  keys: ReadonlyArray<keyof AuthFieldErrors & Path<T>>,
): (fields: AuthFieldErrors) => void {
  return (fields) => {
    for (const key of keys) {
      const message = fields[key];
      if (message) form.setError(key, { message });
    }
  };
}
