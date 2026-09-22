/** The onboarding review uses the same catalog presentation as Profile. */
import { ModalHeader, YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";
import { OverlayModal, SectionCatalogList, useEd } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";

export interface SectionAddOption {
  id: string;
  label: string;
  description: string;
}

export interface SectionAddPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: SectionAddOption[];
  onPick: (id: string) => void;
}

export function SectionAddPicker({
  open,
  onOpenChange,
  options,
  onPick,
}: SectionAddPickerProps): ReactElement {
  const { t } = useI18n();
  const ed = useEd();
  const close = () => onOpenChange(false);
  return (
    <OverlayModal visible={open} onRequestClose={close}>
      <View style={ed.editorModalOverlay}>
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          onPress={close}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <YStack flex={1}>
              <ModalHeader
                title={t("sections.addToResume")}
                compactOnMobile
                closeLabel={t("common.cancel")}
                onClose={close}
              />
            </YStack>
          </View>
          <SectionCatalogList
            options={options.map((option) => ({
              id: option.id,
              title: option.label,
              description: option.description,
            }))}
            onPick={onPick}
          />
        </View>
      </View>
    </OverlayModal>
  );
}
