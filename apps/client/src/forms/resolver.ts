/**
 * Bridge an existing `(values) => fieldErrors | null` validator into a React
 * Hook Form resolver (ADR-0005).
 *
 * The auth validators (validateLogin/validateSignup) already run Zod schemas
 * and map issues to precise i18n messages. Rather than re-encode that, this
 * adapter lets RHF reuse them verbatim — so behavior and messages are
 * preserved exactly while the form moves onto RHF.
 */
import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

export function fieldErrorsResolver<T extends FieldValues>(
  validate: (values: T) => Partial<Record<keyof T & string, string | undefined>> | null,
): Resolver<T> {
  return (values) => {
    const result = validate(values);
    if (!result) return { values, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const key of Object.keys(result) as (keyof T & string)[]) {
      const message = result[key];
      if (message) errors[key] = { type: "validation", message };
    }
    return Object.keys(errors).length > 0
      ? { values: {}, errors: errors as FieldErrors<T> }
      : { values, errors: {} };
  };
}
