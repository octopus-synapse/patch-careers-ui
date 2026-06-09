import { useCallback, useState } from "react";
import type { AuthFieldErrors } from "../validation";

/**
 * Holds the `{ email?, password? }` inline-error map plus a `clearError`
 * that drops a single field's error — the "clear this field's error on
 * change" closure each auth input was hand-rolling. No-ops (returns the
 * same state) when the field has no error, so typing doesn't churn state.
 */
export function useAuthFields(): {
  fieldErrors: AuthFieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<AuthFieldErrors>>;
  clearError: (field: keyof AuthFieldErrors) => void;
} {
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const clearError = useCallback((field: keyof AuthFieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  return { fieldErrors, setFieldErrors, clearError };
}
