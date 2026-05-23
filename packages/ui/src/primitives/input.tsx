/**
 * `<Input>` — text input wrapper around Tamagui's `Input`.
 *
 * Adds default min-height of 44pt for WCAG touch target compliance and
 * pre-wires `accessibilityState` from the `error` prop so screen readers
 * announce validation status (via `aria-invalid` on web).
 */

import { TInput } from "../internal/tamagui-shim";

export type InputProps = {
  /** When non-empty, applies error styling and `aria-invalid`. */
  error?: string | undefined;
  [key: string]: unknown;
};

export function Input({ error, ...rest }: InputProps) {
  const hasError = Boolean(error);
  return (
    <TInput
      minHeight={44}
      borderColor={hasError ? "$red8" : undefined}
      aria-invalid={hasError}
      {...rest}
    />
  );
}
