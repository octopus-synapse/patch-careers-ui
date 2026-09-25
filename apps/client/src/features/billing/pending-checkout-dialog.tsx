import { editorialOverlays } from "@patch-careers/tokens";
import { Text, YStack } from "@patch-careers/ui";
import {
  editorialFonts,
  PrimaryAction,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Modal, Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function PendingCheckoutDialog({
  visible,
  busy,
  error,
  onKeep,
  onCancelAndSwitch,
}: {
  visible: boolean;
  busy: boolean;
  error?: string | null;
  onKeep: () => void;
  onCancelAndSwitch: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const overlays = editorialOverlays[useThemeName()];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeep}>
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding={20}
        backgroundColor={overlays.scrimModal}
      >
        <YStack
          width="100%"
          maxWidth={480}
          padding={28}
          borderRadius={20}
          backgroundColor={palette.surface}
          borderWidth={1}
          borderColor={palette.hairline}
        >
          <YStack gap={18}>
            <Text fontFamily={editorialFonts.serif} fontSize={31} color={palette.ink}>
              {t("go.switchCheckoutTitle")}
            </Text>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={16}
              lineHeight={24}
              color={palette.body}
            >
              {t("go.switchCheckoutBody")}
            </Text>
            {error ? <Text color={palette.danger}>{error}</Text> : null}
            <PrimaryAction
              label={t("go.cancelCheckoutAndSwitch")}
              onPress={onCancelAndSwitch}
              loading={busy}
              fullWidth
            />
            <Pressable accessibilityRole="button" disabled={busy} onPress={onKeep}>
              <YStack alignItems="center" padding={12}>
                <Text fontFamily={editorialFonts.sans} fontSize={15} color={palette.accentDeep}>
                  {t("go.keepCheckout")}
                </Text>
              </YStack>
            </Pressable>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
