/**
 * AnimatedField — wraps a form field block with a stagger entering animation.
 * Use for groups: <label + input + error>.
 */

import type { ReactElement, ReactNode } from "react";
import Animated from "react-native-reanimated";
import { editorialFadeInDown } from "./motion";

export function AnimatedField({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}): ReactElement {
  return <Animated.View entering={editorialFadeInDown(delay)}>{children}</Animated.View>;
}
