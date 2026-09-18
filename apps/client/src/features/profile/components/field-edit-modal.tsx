/** Compact profile editor matching the location card, with inline validation. */
import { landingAccentPalettes, navFilled } from "@patch-careers/tokens";
import {
  Button,
  Input,
  ModalHeader,
  PhoneInput,
  Sheet,
  Text,
  XStack,
  YStack,
} from "@patch-careers/ui";
import {
  editorialFonts,
  FieldError,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useI18n } from "@/providers/i18n-provider";
import type { ProfileFieldDescriptor } from "../lib/profile-fields";
import {
  normalizeProfilePhone,
  profileFieldMaxLength,
  validateProfileField,
} from "../lib/profile-validation";
import { usePf } from "../lib/styles";

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
  const theme = useThemeName();
  const indigo = landingAccentPalettes[theme].indigo.accent;
  const onAccent = navFilled[theme].onFill;
  const pf = usePf();
  const multiline = descriptor.kind === "textarea";
  const isPhone = descriptor.kind === "phone";
  const initialText = isPhone ? normalizeProfilePhone(initialValue) : initialValue;
  const [text, setText] = useState(initialText);
  const [touched, setTouched] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const max = profileFieldMaxLength(descriptor.key);
  const error = validateProfileField(descriptor.key, text, t);
  const canSave = error === null && !isPending;
  const dirty = text !== initialText;
  const count = text.trim().length;

  const save = async (): Promise<void> => {
    setTouched(true);
    if (!canSave) return;
    try {
      await onSave(text.trim());
      onClose();
    } catch {
      // Keep the draft open on failure; the mutation surfaces the error.
    }
  };

  const requestClose = (): void => {
    if (isPending || confirmDiscard) return;
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
        closeLabel={t("app.confirmDialog.close")}
        presentation="card"
        webMaxWidth={520}
      >
        <ScrollView style={pf.fieldEditorScroll} keyboardShouldPersistTaps="handled">
          <YStack gap={24} paddingHorizontal={8} paddingTop={8}>
            <ModalHeader
              title={descriptor.label}
              closeLabel={t("app.confirmDialog.close")}
              closeDisabled={isPending}
              onClose={requestClose}
            />

            {isPhone ? (
              <PhoneInput
                label={descriptor.label}
                value={text}
                onChange={(value) => {
                  setText(value);
                  setTouched(true);
                }}
                error={touched && error ? error : undefined}
                autoFocus
                disabled={isPending}
              />
            ) : (
              <YStack>
                <Input
                  value={text}
                  onChangeText={setText}
                  onBlur={() => setTouched(true)}
                  accessibilityLabel={descriptor.label}
                  placeholder={
                    descriptor.key === "headline"
                      ? t("profile.edit.headlinePlaceholderExample")
                      : descriptor.label
                  }
                  placeholderTextColor={palette.subtle}
                  autoFocus
                  autoCorrect
                  autoCapitalize={descriptor.key === "name" ? "words" : "sentences"}
                  editable={!isPending}
                  color={palette.ink}
                  fontFamily={editorialFonts.sans}
                  fontSize={16}
                  backgroundColor="transparent"
                  borderWidth={0}
                  borderBottomWidth={1}
                  borderRadius={0}
                  borderColor={touched && error ? palette.danger : palette.hairlineStrong}
                  paddingHorizontal={0}
                  paddingVertical={8}
                  focusStyle={{ borderColor: indigo, outlineWidth: 0 }}
                  selectionColor={indigo}
                  maxLength={max}
                  onSubmitEditing={multiline ? undefined : () => void save()}
                  {...(multiline
                    ? { multiline: true, autoSize: true, lineHeight: 24, textAlignVertical: "top" }
                    : {})}
                />
                <XStack alignItems="center" justifyContent="space-between" marginTop={8} gap={12}>
                  <YStack flex={1}>{touched && error ? <FieldError text={error} /> : null}</YStack>
                  <Text
                    fontFamily={editorialFonts.mono}
                    fontSize={11}
                    color={count >= max ? palette.danger : palette.subtle}
                  >
                    {count}/{max}
                  </Text>
                </XStack>
              </YStack>
            )}

            <XStack
              alignItems="center"
              justifyContent="flex-end"
              gap={12}
              paddingTop={16}
              borderTopWidth={1}
              borderColor={palette.hairline}
            >
              <Button
                variant="ghost"
                intent="neutral"
                size="sm"
                borderRadius={999}
                color={palette.muted}
                disabled={isPending}
                onPress={requestClose}
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                minWidth={104}
                borderRadius={999}
                backgroundColor={indigo}
                borderColor={indigo}
                color={onAccent}
                disabled={!canSave}
                loading={isPending}
                accessibilityLabel={t("common.save")}
                onPress={() => void save()}
              >
                {isPending ? <ActivityIndicator size="small" color={onAccent} /> : t("common.save")}
              </Button>
            </XStack>
          </YStack>
        </ScrollView>
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
