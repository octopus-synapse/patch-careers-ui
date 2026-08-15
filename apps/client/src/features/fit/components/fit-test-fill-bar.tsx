/**
 * DEV-only test-fill controls for the fit questionnaire (the fit twin of
 * onboarding's `TestFillBar`, and exempt from the anti-hardcoded-strings
 * sweep by the same `*test-fill-bar` filename convention). "test" answers
 * the current question; "test all" answers everything left and submits.
 * Gated by the caller via `isDevTestFillEnabled()`.
 */

import { XStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { GhostButton } from "@/features/sections";

export function FitTestFillBar({
  onFillCurrent,
  onFillAll,
  disabled,
}: {
  /** Absent on the intro screen — there's no current question yet. */
  onFillCurrent?: (() => void) | undefined;
  onFillAll: () => void;
  disabled: boolean;
}): ReactElement {
  return (
    <XStack gap={12} marginVertical={8}>
      {onFillCurrent ? (
        <GhostButton label="test" onPress={onFillCurrent} disabled={disabled} />
      ) : null}
      <GhostButton label="test all" onPress={onFillAll} disabled={disabled} />
    </XStack>
  );
}
