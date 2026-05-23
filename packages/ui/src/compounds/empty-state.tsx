/**
 * `<EmptyState>` — icon + title + description + optional CTA.
 *
 * Centered, vertical layout for "no results" / "nothing here yet" states.
 */

import type { ReactNode } from "react";
import { TYStack } from "../internal/tamagui-shim";
import { Button } from "../primitives/button";
import { Text } from "../primitives/text";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <TYStack alignItems="center" justifyContent="center" gap={12} padding={24}>
      {icon}
      <Text preset="h3" textAlign="center">
        {title}
      </Text>
      {description ? (
        <Text preset="body" textAlign="center" color="$gray10">
          {description}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Button intent="accent" onPress={onCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </TYStack>
  );
}
