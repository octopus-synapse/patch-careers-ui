/**
 * `<SegmentedControl>` — iOS-style picker.
 *
 * Simpler than `Tabs` (no content panes), good for filter rows.
 */

import { intent as intentTokens } from "@patch-careers/tokens/colors";
import { TXStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";
import { Pill } from "../primitives/pill";

export type SegmentedItem<T extends string = string> = { value: T; label: string };

export type SegmentedControlProps<T extends string = string> = {
  items: Array<SegmentedItem<T>>;
  value: T;
  onChange: (next: T) => void;
  accessibilityLabel?: string;
};

export function SegmentedControl<T extends string = string>({
  items,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const themeName = useThemeName();
  const tokens = intentTokens.neutral[themeName];
  return (
    <TXStack
      backgroundColor={tokens.subtleBg}
      borderRadius={9999}
      padding={2}
      gap={2}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel ?? "Selecionar opção"}
    >
      {items.map((item) => (
        <Pill
          key={item.value}
          intent="accent"
          selected={item.value === value}
          onPress={() => onChange(item.value)}
        >
          {item.label}
        </Pill>
      ))}
    </TXStack>
  );
}
