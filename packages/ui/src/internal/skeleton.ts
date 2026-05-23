import { radius as radiusTokens } from "@patch-careers/tokens";
/**
 * Skeleton dimension helpers.
 *
 * Maps the `<Skeleton variant="...">` API to concrete width/height/radius
 * values so the JSX wrapper stays trivial.
 */

export type SkeletonVariant = "rect" | "text" | "avatar" | "circle";

export type SkeletonDimensions = {
  width: number | string;
  height: number;
  borderRadius: number;
};

export function resolveSkeletonDimensions(
  variant: SkeletonVariant,
  width?: number | string,
  height?: number,
): SkeletonDimensions {
  switch (variant) {
    case "text":
      return {
        width: width ?? "100%",
        height: height ?? 14,
        borderRadius: radiusTokens.sm,
      };
    case "avatar":
      return {
        width: width ?? 40,
        height: height ?? 40,
        borderRadius: radiusTokens.full,
      };
    case "circle": {
      const size = typeof width === "number" ? width : 48;
      return {
        width: size,
        height: height ?? size,
        borderRadius: radiusTokens.full,
      };
    }
    case "rect":
      return {
        width: width ?? "100%",
        height: height ?? 80,
        borderRadius: radiusTokens.md,
      };
  }
}
