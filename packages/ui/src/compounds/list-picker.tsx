/**
 * `<ListPicker>` — generic sheet-based "pick one from a list" compound.
 *
 * Generalized from the onboarding `SectionAddPicker`: a bottom sheet with a
 * title, an optional search box, selectable rows (leading icon + label +
 * trailing slot), an empty state, and an optional close button. Drives purely
 * off props so any feature can reuse it.
 */

import { type ReactNode, useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { XStack, YStack } from "../primitives/stack";
import { Text } from "../primitives/text";
import { Sheet } from "./sheet";

// Bound the list to the sheet/modal height so it scrolls inside the frame
// instead of overflowing it. `minHeight: 0` lets the flex child shrink on web.
const listScrollStyle = { flex: 1, minHeight: 0 } as const;

export interface ListPickerOption<T extends string = string> {
  id: T;
  label: string;
  /** Leading slot (e.g. an emoji `<Text>` or an `<Icon>`). */
  icon?: ReactNode;
  /** Trailing slot; defaults to a subtle "+" affordance. */
  trailing?: ReactNode;
  selected?: boolean;
  /** Text the search box matches against (defaults to `label`). */
  searchText?: string;
}

export interface ListPickerProps<T extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ListPickerOption<T>[];
  onPick: (id: T) => void;
  title?: string;
  emptyLabel?: string;
  /** When set, renders a ghost "close" button at the bottom. */
  closeLabel?: string;
  /** Adds a search box that filters by label (case-insensitive). */
  searchable?: boolean;
  searchPlaceholder?: string;
  snapPoints?: number[];
}

export function ListPicker<T extends string = string>({
  open,
  onOpenChange,
  options,
  onPick,
  title,
  emptyLabel,
  closeLabel,
  searchable = false,
  searchPlaceholder,
  snapPoints = [60],
}: ListPickerProps<T>) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    if (!searchable) return options;
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.searchText ?? o.label).toLowerCase().includes(q));
  }, [options, search, searchable]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      title={title ?? "Selecionar"}
    >
      <YStack gap={12} flex={1}>
        {searchable ? (
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder ?? "Buscar..."}
          />
        ) : null}
        {visible.length === 0 ? (
          <Text preset="body" color="$gray10">
            {emptyLabel ?? "Nenhuma opção disponível."}
          </Text>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" style={listScrollStyle}>
            <YStack gap={6}>
              {visible.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => onPick(option.id)}
                  accessibilityRole="button"
                >
                  <XStack
                    alignItems="center"
                    gap={10}
                    paddingVertical={12}
                    paddingHorizontal={12}
                    borderWidth={1}
                    borderColor="$gray6"
                    borderRadius={12}
                  >
                    {option.icon}
                    <Text flex={1}>{option.label}</Text>
                    {option.trailing ?? <Text color="$blue10">+</Text>}
                  </XStack>
                </Pressable>
              ))}
            </YStack>
          </ScrollView>
        )}
        {closeLabel ? (
          <Button variant="ghost" intent="neutral" onPress={() => onOpenChange(false)}>
            {closeLabel}
          </Button>
        ) : null}
      </YStack>
    </Sheet>
  );
}
