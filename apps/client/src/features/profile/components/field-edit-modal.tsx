/**
 * <FieldEditModal> — focused single-field editor for a profile field (name,
 * headline, bio, or one social link). Centered card chrome (serif title + X)
 * matching the global search / location modals, with a bordered Input and one
 * Save action — replacing the old cramped bottom sheet. Location has its own
 * search modal; this handles the text/url/textarea fields.
 */
import { Input, Sheet } from "@patch-careers/ui";
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import type { ProfileFieldDescriptor } from "../lib/profile-fields";

export function FieldEditModal({
  descriptor,
  initialValue,
  open,
  onClose,
  onSave,
  isPending,
}: {
  descriptor: ProfileFieldDescriptor;
  initialValue: string;
  open: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
  isPending: boolean;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const [text, setText] = useState(initialValue);

  const multiline = descriptor.kind === "textarea";
  const isUrl = descriptor.kind === "url";
  const canSave = descriptor.required ? text.trim().length > 0 : true;

  const save = async (): Promise<void> => {
    try {
      await onSave(text.trim());
      onClose();
    } catch {
      // Keep the modal open on failure (the mutation surfaces the error).
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={descriptor.label}
      presentation="card"
      fillHeight
    >
      <View style={styles.body}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder={descriptor.label}
          placeholderTextColor={palette.subtle}
          autoFocus
          autoCorrect={!isUrl}
          autoCapitalize={isUrl ? "none" : "sentences"}
          keyboardType={isUrl ? "url" : "default"}
          color={palette.ink}
          fontSize={16}
          {...(multiline ? { multiline: true, minHeight: 120, textAlignVertical: "top" } : {})}
        />
        <PrimaryAction
          label={t("common.save")}
          onPress={() => void save()}
          loading={isPending}
          disabled={isPending || !canSave}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 20 },
});
