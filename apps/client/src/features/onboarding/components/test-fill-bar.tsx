/**
 * DEV-only test-fill controls, rendered above the step heading. "test" fills
 * the current step; "test all" (first step only) fills everything end-to-end
 * and jumps to review. Gated by the caller via `isDevTestFillEnabled()`.
 */

import { XStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { GhostButton } from "@/features/sections";
import type { FlowStepId } from "../lib/flow-plan";

export function TestFillBar({
  flowStepId,
  onFillStep,
  onFillAll,
  disabled,
}: {
  flowStepId: FlowStepId;
  onFillStep: () => void;
  onFillAll: () => void;
  disabled?: boolean;
}): ReactElement {
  const isFirst = flowStepId === "language";
  return (
    <XStack gap={12} marginBottom={8}>
      <GhostButton label="test" onPress={onFillStep} disabled={disabled ?? false} />
      {isFirst ? (
        <GhostButton label="test all" onPress={onFillAll} disabled={disabled ?? false} />
      ) : null}
    </XStack>
  );
}
