/**
 * `<LongPressMenu>` — context menu triggered by sustained press.
 *
 * Uses Tamagui's `Popover` with a long-press wrapper on the trigger.
 * Fires a `medium` haptic when the menu opens to match iOS's contextual-
 * action affordance.
 */

import { type ComponentType, type ReactNode, useState } from "react";
import { hapticImpact } from "../internal/haptics";
import { asLoose, TPopover, TYStack } from "../internal/tamagui-shim";

type LooseTriggerProps = {
  asChild?: boolean;
  delayLongPress?: number;
  onLongPress?: () => void;
  children?: ReactNode;
};
// Cast the compound's Trigger to expose RN-specific props (`delayLongPress`,
// `onLongPress`) that Tamagui's StackProps doesn't surface.
const PopoverTrigger = asLoose<ComponentType<LooseTriggerProps>>(TPopover.Trigger);

export type LongPressMenuItem = {
  key: string;
  label: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
};

export type LongPressMenuProps = {
  trigger: ReactNode;
  items: LongPressMenuItem[];
};

export function LongPressMenu({ trigger, items }: LongPressMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <TPopover
      open={open}
      onOpenChange={(next: boolean) => {
        if (next) hapticImpact("medium");
        setOpen(next);
      }}
      placement="bottom"
    >
      <PopoverTrigger
        asChild
        delayLongPress={400}
        onLongPress={() => {
          hapticImpact("medium");
          setOpen(true);
        }}
      >
        {trigger}
      </PopoverTrigger>
      <TPopover.Content
        padding={4}
        borderRadius={12}
        elevate
        enterStyle={{ opacity: 0, scale: 0.95 }}
        exitStyle={{ opacity: 0, scale: 0.95 }}
        animation="quick"
      >
        <TYStack minWidth={160}>
          {items.map((item) => (
            <TPopover.Close
              asChild
              key={item.key}
              onPress={() => {
                if (item.destructive) hapticImpact("heavy");
                item.onSelect();
              }}
            >
              <TYStack padding={10} borderRadius={6} hoverStyle={{ backgroundColor: "$gray3" }}>
                {item.label}
              </TYStack>
            </TPopover.Close>
          ))}
        </TYStack>
      </TPopover.Content>
    </TPopover>
  );
}
