/**
 * `<Skeleton>` — placeholder block with pulse animation.
 *
 * The wrapper delegates dimension calculation to `resolveSkeletonDimensions`
 * (pure) and uses Tamagui's configured animation driver for the
 * visual effect.
 */

import { resolveSkeletonDimensions, type SkeletonVariant } from "../internal/skeleton";
import { TStack } from "../internal/tamagui-shim";

export type SkeletonProps = {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
};

export function Skeleton({ variant = "rect", width, height }: SkeletonProps) {
  const dims = resolveSkeletonDimensions(variant, width, height);
  return (
    <TStack
      width={dims.width}
      height={dims.height}
      borderRadius={dims.borderRadius}
      backgroundColor="$gray5"
      opacity={0.6}
      animation="quick"
      accessibilityLabel="Carregando"
      accessibilityRole="progressbar"
    />
  );
}
