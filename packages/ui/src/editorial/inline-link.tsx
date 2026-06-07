/**
 * InlineLink — right-aligned subtle link (e.g. "Forgot password?").
 *
 * Router-agnostic: the app wires navigation via `onPress` (the package never
 * imports expo-router). Wraps `EditorialTextLink` (the inline recipe) in a
 * block stack for alignment.
 */

import type { ReactElement } from "react";
import { TYStack } from "../internal/tamagui-shim";
import { EditorialTextLink } from "./editorial-text-link";

export type InlineLinkProps = {
  label: string;
  onPress: () => void;
  align?: "left" | "right";
  testID?: string;
};

export function InlineLink({
  label,
  onPress,
  align = "right",
  testID,
}: InlineLinkProps): ReactElement {
  return (
    <TYStack marginTop={12} alignItems={align === "right" ? "flex-end" : "flex-start"}>
      <EditorialTextLink
        label={label}
        onPress={onPress}
        fontSize={13}
        {...(testID ? { testID } : {})}
      />
    </TYStack>
  );
}
