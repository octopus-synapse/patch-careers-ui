/**
 * `<Tabs>` — segmented control + content panels.
 *
 * Built on Tamagui's `Tabs` (already accessible: `role=tablist/tab/tabpanel`).
 * We wrap to enforce a consistent visual treatment.
 */

import type { ReactNode } from "react";
import { TTabs } from "../internal/tamagui-shim";

export type TabItem = { value: string; label: string; content: ReactNode };

export type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (next: string) => void;
};

export function Tabs({ items, ...rest }: TabsProps) {
  return (
    <TTabs orientation="horizontal" flexDirection="column" {...rest}>
      <TTabs.List backgroundColor="$gray3" borderRadius={8} padding={4}>
        {items.map((it) => (
          <TTabs.Tab key={it.value} value={it.value} flex={1} padding={8} borderRadius={6}>
            {it.label}
          </TTabs.Tab>
        ))}
      </TTabs.List>
      {items.map((it) => (
        <TTabs.Content key={it.value} value={it.value} padding={12}>
          {it.content}
        </TTabs.Content>
      ))}
    </TTabs>
  );
}
