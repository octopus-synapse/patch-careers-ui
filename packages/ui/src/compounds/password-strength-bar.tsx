/**
 * `<PasswordStrengthBar>` — 4-segment bar tinted by `evaluatePasswordStrength`.
 *
 * Segments illuminate left-to-right as the score climbs. Color ramps
 * danger (1) → neutral (2) → accent (3) → success (4). Hints render as
 * a caption list below the bar.
 */

import { intent as intentTokens } from "@patch-careers/tokens";
import { evaluatePasswordStrength } from "../internal/password-strength";
import { TXStack, TYStack } from "../internal/tamagui-shim";
import type { Intent } from "../internal/types";
import { useThemeName } from "../internal/use-theme-name";
import { Text } from "../primitives/text";

const SCORE_TO_INTENT: Record<0 | 1 | 2 | 3 | 4, Intent> = {
  0: "neutral",
  1: "danger",
  2: "danger",
  3: "accent",
  4: "success",
};

const HINT_LABEL: Record<string, string> = {
  min_length_8: "Mínimo 8 caracteres",
  mixed_case: "Combine maiúsculas e minúsculas",
  add_digit: "Adicione um número",
  add_symbol: "Adicione um símbolo",
};

export type PasswordStrengthBarProps = {
  password: string;
  showHints?: boolean;
};

export function PasswordStrengthBar({ password, showHints = true }: PasswordStrengthBarProps) {
  const themeName = useThemeName();
  const { score, hints } = evaluatePasswordStrength(password);
  const activeIntent = SCORE_TO_INTENT[score];
  const activeColor = intentTokens[activeIntent][themeName].bg;

  return (
    <TYStack gap={4}>
      <TXStack gap={4}>
        {[1, 2, 3, 4].map((segment) => (
          <TYStack
            key={segment}
            flex={1}
            height={4}
            borderRadius={2}
            backgroundColor={segment <= score ? activeColor : "$gray5"}
            accessibilityRole="none"
          />
        ))}
      </TXStack>
      {showHints && hints.length > 0 ? (
        <TYStack gap={2} accessibilityLiveRegion="polite">
          {hints.map((hint) => (
            <Text key={hint} preset="caption" color="$gray10">
              {HINT_LABEL[hint] ?? hint}
            </Text>
          ))}
        </TYStack>
      ) : null}
    </TYStack>
  );
}
