/** `expo-image` for jsdom — plain RN Image; `expo-image` drags the Metro runtime in. */

import type { ReactElement } from "react";
import { Image as RNImage, type ImageProps as RNImageProps } from "react-native";

type Source = RNImageProps["source"] | string | null | undefined;

export function Image({
  source,
  ...rest
}: Omit<RNImageProps, "source"> & { source?: Source }): ReactElement {
  const resolved = typeof source === "string" ? { uri: source } : (source ?? undefined);
  return <RNImage {...rest} source={resolved as RNImageProps["source"]} />;
}
export default Image;
