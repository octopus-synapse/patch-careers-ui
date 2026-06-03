/**
 * PasswordStrengthMeter — 4 segments + score label + requirement chips.
 * Scoring/labels/colors come from `internal/editorial-password`.
 */

import { editorialPalette } from "@patch-careers/tokens";
import type { ReactElement } from "react";
import {
  type PasswordHints,
  passwordChecks,
  STRENGTH_COLOR,
  STRENGTH_LABEL,
  scorePassword,
} from "../internal/editorial-password";
import { TStack, TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

const SEGMENTS = [0, 1, 2, 3];

export function PasswordStrengthMeter({
  password,
  hints,
}: {
  password: string;
  hints?: PasswordHints;
}): ReactElement {
  const score = scorePassword(password);
  const color = STRENGTH_COLOR[score];
  const label = STRENGTH_LABEL[score];
  const checks = passwordChecks(password, hints);

  return (
    <TYStack marginTop={14} gap={10}>
      <TXStack gap={4}>
        {SEGMENTS.map((i) => (
          <TStack
            key={i}
            flex={1}
            height={3}
            backgroundColor="$hairline"
            borderRadius={2}
            overflow="hidden"
          >
            <TStack flex={1} borderRadius={2} backgroundColor={i < score ? color : "transparent"} />
          </TStack>
        ))}
      </TXStack>
      <TXStack alignItems="center" justifyContent="space-between" gap={8}>
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={11}
          fontWeight="600"
          letterSpacing={0.8}
          textTransform="uppercase"
          color={score > 0 ? color : editorialPalette.subtle}
        >
          {label}
        </TText>
        <TXStack gap={10} flexWrap="wrap">
          {checks.map((c) => (
            <TXStack key={c.label} alignItems="center" gap={4}>
              <TStack
                width={5}
                height={5}
                borderRadius={3}
                backgroundColor={c.ok ? editorialPalette.success : editorialPalette.hairline}
              />
              <TText
                fontFamily={editorialFonts.mono}
                fontSize={10}
                letterSpacing={0.4}
                color={c.ok ? "$inkBody" : "$inkSubtle"}
              >
                {c.label}
              </TText>
            </TXStack>
          ))}
        </TXStack>
      </TXStack>
    </TYStack>
  );
}
