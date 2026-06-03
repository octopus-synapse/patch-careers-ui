/**
 * AnimatedField — wraps a form field block with a stagger entering animation.
 * Use for groups: <label + input + error>.
 */

import type { ReactElement, ReactNode } from "react";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

export function AnimatedField({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}): ReactElement {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}
    >
      {children}
    </Animated.View>
  );
}
