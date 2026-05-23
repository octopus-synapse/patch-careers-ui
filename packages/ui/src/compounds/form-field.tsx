/**
 * `<FormField>` — composer for Label + Input + inline error / hint.
 *
 * The single most-used building block for forms. Auto-wires
 * `accessibilityLabel` on the Input and renders error text with
 * `accessibilityLiveRegion="polite"` so screen readers announce it.
 */

import { TYStack } from "../internal/tamagui-shim";
import { Input, type InputProps } from "../primitives/input";
import { Label } from "../primitives/label";
import { Text } from "../primitives/text";

export type FormFieldProps = InputProps & {
  label: string;
  hint?: string;
  required?: boolean;
};

export function FormField({ label, hint, error, required, ...inputProps }: FormFieldProps) {
  const labelProps = required ? { required } : {};
  const errorProps = error !== undefined ? { error } : {};
  return (
    <TYStack gap={4}>
      <Label {...labelProps}>{label}</Label>
      <Input accessibilityLabel={label} {...inputProps} {...errorProps} />
      {error ? (
        <Text preset="caption" color="$red10" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text preset="caption" color="$gray10">
          {hint}
        </Text>
      ) : null}
    </TYStack>
  );
}
