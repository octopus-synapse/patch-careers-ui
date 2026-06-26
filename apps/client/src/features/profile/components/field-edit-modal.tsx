/**
 * <FieldEditModal> — focused single-field editor for a profile text field
 * (name, headline, bio, phone). Centered card chrome (serif title + X) with a
 * bordered Input and one Save action. Beyond editing it:
 *   - validates inline against the shared profile schema (<FieldError>);
 *   - shows a live character counter against the field's max;
 *   - masks phone input as BR `(DD) numbers`;
 *   - renders a live "as it reads on your resume" preview for the bio;
 *   - guards unsaved changes with a discard confirm on close.
 * Location has its own search modal; the dispatcher routes to the right one.
 */
import { Input, Sheet } from "@patch-careers/ui";
import {
  editorialFonts,
  FieldError,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useI18n } from "@/providers/i18n-provider";
import type { ProfileFieldDescriptor } from "../lib/profile-fields";
import {
  formatPhoneBR,
  profileFieldMaxLength,
  validateProfileField,
} from "../lib/profile-validation";

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
  const [touched, setTouched] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const multiline = descriptor.kind === "textarea";
  const isPhone = descriptor.kind === "phone";
  const isBio = descriptor.key === "bio";
  const max = profileFieldMaxLength(descriptor.key);

  const error = validateProfileField(descriptor.key, text, t);
  const canSave = error === null;
  const dirty = text !== initialValue;
  const count = text.trim().length;

  const handleChange = (next: string): void => {
    setText(isPhone ? formatPhoneBR(next) : next);
  };

  const save = async (): Promise<void> => {
    setTouched(true);
    if (!canSave) return;
    try {
      await onSave(text.trim());
      onClose();
    } catch {
      // Keep the modal open on failure (the mutation surfaces the error).
    }
  };

  const requestClose = (): void => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
        title={descriptor.label}
        presentation="card"
        fillHeight
      >
        <View style={styles.body}>
          <View>
            <Input
              value={text}
              onChangeText={handleChange}
              onBlur={() => setTouched(true)}
              placeholder={
                descriptor.key === "headline"
                  ? t("profile.edit.headlinePlaceholderExample")
                  : descriptor.label
              }
              placeholderTextColor={palette.subtle}
              autoFocus
              autoCorrect={!isPhone}
              autoCapitalize={isPhone ? "none" : "sentences"}
              keyboardType={isPhone ? "phone-pad" : "default"}
              color={palette.ink}
              fontSize={16}
              maxLength={max}
              {...(multiline ? { multiline: true, minHeight: 120, textAlignVertical: "top" } : {})}
            />
            <View style={styles.metaRow}>
              <View style={styles.errorSlot}>
                {touched && error ? <FieldError text={error} /> : null}
              </View>
              <Text
                style={[styles.counter, { color: count >= max ? palette.danger : palette.subtle }]}
              >
                {count}/{max}
              </Text>
            </View>
          </View>

          {isBio && count > 0 ? (
            <View
              style={[
                styles.preview,
                { borderColor: palette.hairline, backgroundColor: palette.surface },
              ]}
            >
              <Text style={[styles.previewLabel, { color: palette.muted }]}>
                {t("profile.edit.bioPreview")}
              </Text>
              <Text style={[styles.previewText, { color: palette.body }]}>{text.trim()}</Text>
            </View>
          ) : null}

          <PrimaryAction
            label={t("common.save")}
            onPress={() => void save()}
            loading={isPending}
            disabled={isPending || !canSave}
          />
        </View>
      </Sheet>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t("profile.edit.unsaved.title")}
        description={t("profile.edit.unsaved.description")}
        confirmLabel={t("profile.edit.unsaved.discard")}
        danger
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 12,
  },
  errorSlot: { flex: 1 },
  counter: { fontFamily: editorialFonts.sans, fontSize: 12 },
  preview: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  previewLabel: {
    fontFamily: editorialFonts.sans,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  previewText: { fontFamily: editorialFonts.serif, fontSize: 15, lineHeight: 22 },
});
