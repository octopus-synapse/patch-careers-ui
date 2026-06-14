/**
 * DisplayHeading + SubtitleLine + IntroBlock — the large serif italic
 * headline, its muted subtitle, and the stacked brand + heading intro.
 */

import type { ReactElement, ReactNode } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { TText, TYStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";
import { editorialFadeInDown } from "./motion";
import { Wordmark } from "./wordmark";

export function DisplayHeading({
  prefix,
  emphasis,
  suffix,
}: {
  prefix?: string;
  emphasis: string;
  suffix?: string;
}): ReactElement {
  return (
    <Animated.View entering={editorialFadeInDown(100, 600)}>
      <TText
        fontFamily={editorialFonts.serif}
        fontSize={38}
        lineHeight={44}
        color="$ink"
        letterSpacing={-0.8}
        fontWeight="400"
      >
        {prefix ? <TText fontStyle="normal">{prefix}</TText> : null}
        <TText fontStyle="italic">{emphasis}</TText>
        {suffix ? <TText fontStyle="normal">{suffix}</TText> : null}
      </TText>
    </Animated.View>
  );
}

export function SubtitleLine({ children }: { children: ReactNode }): ReactElement {
  return (
    <Animated.View entering={editorialFadeInDown(200, 600)}>
      <TText
        fontFamily={editorialFonts.sans}
        fontSize={15}
        lineHeight={22}
        color="$inkBody"
        maxWidth={340}
      >
        {children}
      </TText>
    </Animated.View>
  );
}

export function IntroBlock({
  prefix,
  emphasis,
  suffix,
  subtitle,
  showWordmark = true,
}: {
  prefix?: string;
  emphasis: string;
  suffix?: string;
  subtitle: ReactNode;
  /** Shows the "Patch · CAREERS" wordmark. Off on sign-in/sign-up. */
  showWordmark?: boolean;
}): ReactElement {
  return (
    <TYStack marginBottom={36}>
      {showWordmark ? (
        <Animated.View entering={FadeIn.duration(500)}>
          <Wordmark />
        </Animated.View>
      ) : null}
      <TYStack marginTop={showWordmark ? 28 : 0} gap={14}>
        <DisplayHeading
          {...(prefix ? { prefix } : {})}
          emphasis={emphasis}
          {...(suffix ? { suffix } : {})}
        />
        <SubtitleLine>{subtitle}</SubtitleLine>
      </TYStack>
    </TYStack>
  );
}
