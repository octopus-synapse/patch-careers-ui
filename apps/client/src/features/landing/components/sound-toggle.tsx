/**
 * `SoundToggle` — the prototype's `#snd` button: a small speaker pinned to the
 * bottom-right corner that opts the page's tiny WebAudio cues in and out.
 * Desktop web only, exactly like the demo (`display:none` under 1024px).
 */

import { YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useSyncExternalStore } from "react";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { landingSound } from "../lib/landing-sound";

export function SoundToggle(): ReactElement {
  const palette = useEditorialPalette();
  const on = useSyncExternalStore(
    (notify) => landingSound.subscribe(notify),
    () => landingSound.isEnabled(),
    () => false,
  );
  const color = on ? palette.ink : palette.muted;

  return (
    <YStack position="absolute" right={16} bottom={18} zIndex={50}>
      <Pressable
        onPress={() => landingSound.setEnabled(!on)}
        accessibilityRole="button"
        aria-label="Som"
      >
        <YStack
          width={34}
          height={34}
          borderRadius={999}
          borderWidth={1}
          borderColor={on ? palette.ink : palette.hairline}
          backgroundColor={palette.panel}
          alignItems="center"
          justifyContent="center"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M11 5 6 9H3v6h3l5 4z"
              stroke={color}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M15.5 8.5a5 5 0 0 1 0 7"
              stroke={color}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <Path
              d="M18.5 5.5a9 9 0 0 1 0 13"
              stroke={color}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </Svg>
        </YStack>
      </Pressable>
    </YStack>
  );
}
