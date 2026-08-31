/**
 * The quiet row under the fields on web: the "keep me signed in" checkbox
 * left-aligned, with an optional right-hand slot (sign-in puts "forgot
 * password" there so neither link floats alone in the column).
 */
import { XStack } from "@patch-careers/ui";
import { CheckboxField } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { useTranslator } from "@/providers/i18n-provider";

export function KeepSignedInRow({
  checked,
  onToggle,
  testID,
  right,
}: {
  checked: boolean;
  onToggle: () => void;
  testID: string;
  right?: ReactNode;
}): ReactElement {
  const t = useTranslator();
  return (
    <XStack
      alignItems="center"
      justifyContent={right ? "space-between" : "flex-start"}
      marginTop={26}
    >
      <CheckboxField
        checked={checked}
        onToggle={onToggle}
        label={t("auth.keepSignedIn")}
        delay={300}
        testID={testID}
      />
      {right}
    </XStack>
  );
}
