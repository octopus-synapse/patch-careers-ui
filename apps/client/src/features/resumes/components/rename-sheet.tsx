/** Rename a resume — small shared <Sheet> with one underline input. */
import { Sheet } from "@patch-careers/ui";
import { PrimaryAction, UnderlineInput } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export function RenameSheet({
  open,
  onOpenChange,
  currentTitle,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  isPending: boolean;
  onSubmit: (title: string) => Promise<void>;
}): ReactElement {
  const [title, setTitle] = useState(currentTitle);

  // Re-seed each open with the latest saved title.
  useEffect(() => {
    if (open) setTitle(currentTitle);
  }, [open, currentTitle]);

  const save = async (): Promise<void> => {
    try {
      await onSubmit(title.trim());
      onOpenChange(false);
    } catch {
      // Keep the sheet open on failure.
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Renomear currículo">
      <View style={styles.body}>
        <UnderlineInput label="Nome do currículo" value={title} onChangeText={setTitle} />
        <PrimaryAction
          label="Salvar"
          onPress={() => void save()}
          loading={isPending}
          disabled={title.trim().length === 0 || isPending}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 22, paddingBottom: 8 },
});
