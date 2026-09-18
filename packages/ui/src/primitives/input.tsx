/**
 * `<Input>` — text input wrapper around Tamagui's `Input`.
 *
 * Adds default min-height of 44pt for WCAG touch target compliance and
 * pre-wires `accessibilityState` from the `error` prop so screen readers
 * announce validation status (via `aria-invalid` on web).
 */

import { TInput } from "../internal/tamagui-shim";
import { useInputAutoSize } from "../internal/use-input-auto-size";

export type InputProps = {
  /** When non-empty, applies error styling and `aria-invalid`. */
  error?: string | undefined;
  /** Grow and shrink a multiline input to fit its content. */
  autoSize?: boolean;
  [key: string]: unknown;
};

export function Input({ error, autoSize = false, ...rest }: InputProps) {
  const hasError = Boolean(error);
  const sizing = useInputAutoSize(autoSize && rest.multiline === true, rest.value);
  return (
    <TInput
      minHeight={44}
      borderColor={hasError ? "$red8" : undefined}
      aria-invalid={hasError}
      {...rest}
      {...sizing}
    />
  );
}
