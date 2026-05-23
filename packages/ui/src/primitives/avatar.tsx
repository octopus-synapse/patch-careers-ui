/**
 * `<Avatar>` — image with initial-letter fallback.
 *
 * When `src` is missing or fails to load, renders a colored circle with
 * `initialsFromName(name)` centered inside. The fill color is a
 * deterministic hash so the same name always paints the same hue.
 */

import { useState } from "react";
import { Image } from "react-native";
import { avatarBackgroundColor, initialsFromName } from "../internal/avatar";
import { TStack } from "../internal/tamagui-shim";
import { Text } from "./text";

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
  size?: AvatarSize;
  accessibilityLabel?: string;
};

export function Avatar({ src, name, size = "md", accessibilityLabel }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const px = SIZE_TO_PX[size];
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
          onError={() => setErrored(true)}
        />
      )}
    </TStack>
  );
}
