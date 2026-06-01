/**
 * `<SectionAddPicker>` — the review hub's "Adicionar seção" sheet. Lists the
 * optional sections the backend exposes via `availableExtras` (filtered to
 * those not yet activated) and reports the chosen extra id back so the hub
 * can activate it (`POST /v1/onboarding/session/extras`) and open its
 * editor inline.
 */

import { Button, Sheet, Text, XStack, YStack } from "@patch-careers/ui";
import { Pressable, ScrollView } from "react-native";

export interface SectionAddOption {
  id: string;
  label: string;
  icon?: string | undefined;
}

export interface SectionAddPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: SectionAddOption[];
  onPick: (id: string) => void;
  title?: string;
  emptyLabel?: string;
}

export function SectionAddPicker({
  open,
  onOpenChange,
  options,
  onPick,
  title,
  emptyLabel,
}: SectionAddPickerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[60]}>
      <YStack gap={12} flex={1}>
        <Text preset="h3">{title ?? "Adicionar seção"}</Text>
        {options.length === 0 ? (
          <Text preset="body" color="$gray10">
            {emptyLabel ?? "Você já adicionou todas as seções disponíveis."}
          </Text>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            <YStack gap={6}>
              {options.map((option) => (
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
                    {option.icon ? <Text>{option.icon}</Text> : null}
                    <Text flex={1}>{option.label}</Text>
                    <Text color="$blue10">+</Text>
                  </XStack>
                </Pressable>
              ))}
            </YStack>
          </ScrollView>
        )}
        <Button variant="ghost" intent="neutral" onPress={() => onOpenChange(false)}>
          Fechar
        </Button>
      </YStack>
    </Sheet>
  );
}
