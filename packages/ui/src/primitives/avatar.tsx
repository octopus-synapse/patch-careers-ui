/**
 * `<Avatar>` — image with initial-letter fallback.
 *
 * When `src` is missing or fails to load, renders a colored circle with
 * `initialsFromName(name)` centered inside. The fill color is a
 * deterministic hash so the same name always paints the same hue. The photo
 * loads through `expo-image` (memory+disk cache, blurhash placeholder, soft
 * fade-in) so re-renders and tab switches don't re-fetch or flash.
 */

import { Image } from "expo-image";
import { useState } from "react";
import { avatarBackgroundColor, initialsFromName } from "../internal/avatar";
import { TStack } from "../internal/tamagui-shim";
import { Text } from "./text";

// A neutral light-grey blurhash shown while the real photo decodes.
const PLACEHOLDER_BLURHASH = "L6Pj0^jE.AyE_3t7t7R**0o#DgR4";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_TO_PX: Record<AvatarSize, number> = {
  sm: 24,
  md: 40,
  lg: 56,
  xl: 80,
};

export type AvatarProps = {
  src?: string | undefined;
  name: string;
  /** A named preset, or an explicit pixel size for fine control. */
  size?: AvatarSize | number;
  accessibilityLabel?: string;
};

export function Avatar({ src, name, size = "md", accessibilityLabel }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const px = typeof size === "number" ? size : SIZE_TO_PX[size];
  const bgColor = avatarBackgroundColor(name);
  const showFallback = !src || errored;

  return (
    <TStack
      width={px}
      height={px}
      borderRadius={px / 2}
      backgroundColor={bgColor}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Avatar de ${name}`}
    >
      {showFallback ? (
        <Text preset="label" color="white">
          {initialsFromName(name)}
        </Text>
      ) : (
        <Image
          source={{ uri: src }}
          style={{ width: px, height: px }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
          onError={() => setErrored(true)}
        />
      )}
    </TStack>
  );
}
