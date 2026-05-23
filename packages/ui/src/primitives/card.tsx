/**
 * `<Card>` — surface container with token-driven radius + shadow.
 *
 * Density follows D63 confortável guideline: 16px padding, 12px gap.
 */

import { radius } from "@patch-careers/tokens/radius";
import { shadows } from "@patch-careers/tokens/shadows";
import { spacing } from "@patch-careers/tokens/spacing";
import { TCard } from "../internal/tamagui-shim";

export type CardProps = {
  elevated?: boolean;
  [key: string]: unknown;
};

export function Card({ elevated = true, ...rest }: CardProps) {
  return (
    <TCard
      padding={spacing[4]}
      borderRadius={radius.lg}
      shadowColor={elevated ? shadows.md.mobile.shadowColor : "transparent"}
      shadowOpacity={elevated ? shadows.md.mobile.shadowOpacity : 0}
      shadowOffset={elevated ? shadows.md.mobile.shadowOffset : { width: 0, height: 0 }}
      shadowRadius={elevated ? shadows.md.mobile.shadowRadius : 0}
      elevation={elevated ? shadows.md.mobile.elevation : 0}
      {...rest}
    />
  );
}
