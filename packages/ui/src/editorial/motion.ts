/**
 * Editorial entrance choreography.
 *
 * A downward fade-in on the `Easing.out(Easing.cubic)` curve — the
 * entrance every editorial component was hand-rolling as
 * `FadeInDown.delay(d).duration(dur).easing(Easing.out(Easing.cubic))`.
 * Centralised so the curve has one definition.
 */

import { Easing, FadeInDown } from "react-native-reanimated";

export function editorialFadeInDown(delay = 0, duration = 500) {
  return FadeInDown.delay(delay).duration(duration).easing(Easing.out(Easing.cubic));
}
