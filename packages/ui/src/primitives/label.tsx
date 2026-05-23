/**
 * `<Label>` — form label tied to the `label` typography preset.
 */

import type { ReactNode } from "react";
import { Text, type TextProps } from "./text";

export type LabelProps = TextProps & {
  required?: boolean;
  children?: ReactNode;
};

export function Label({ required, children, ...rest }: LabelProps) {
  return (
    <Text preset="label" {...rest}>
      {children}
      {required ? " *" : null}
    </Text>
  );
}
