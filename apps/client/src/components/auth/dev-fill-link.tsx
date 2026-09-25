/**
 * DEV-only "test" affordance in the card's top-right corner. Most forms
 * prefill locally; checkout tokenizes and submits the test card in one click
 * because a cross-origin secure card iframe cannot be scripted. Renders
 * nothing unless the dev
 * test-fill flag is on (same gate as the onboarding test-fill).
 */
import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { isDevTestFillEnabled } from "@/config/dev-flags";

export function DevFillLink({
  onPress,
  testID,
}: {
  onPress: () => void;
  testID: string;
}): ReactElement | null {
  if (!isDevTestFillEnabled()) return null;
  return (
    <YStack alignItems="flex-end" marginBottom={2}>
      <Text
        onPress={onPress}
        accessibilityRole="button"
        cursor="pointer"
        fontFamily={editorialFonts.mono}
        fontSize={10}
        letterSpacing={1.4}
        color="$inkSubtle"
        paddingVertical={4}
        paddingHorizontal={6}
        testID={testID}
      >
        test
      </Text>
    </YStack>
  );
}
