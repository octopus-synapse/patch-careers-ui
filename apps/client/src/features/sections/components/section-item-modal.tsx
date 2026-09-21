/** One centered editor layout for every section, in onboarding and the profile. */
import { authDialogPalette, navFilled } from "@patch-careers/tokens";
import { Button, ModalHeader, Sheet, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect } from "react";
import type { Control } from "react-hook-form";
import { ActivityIndicator, Platform, ScrollView, useWindowDimensions } from "react-native";
import { ensureSectionModalScrollbar } from "../lib/section-modal-scrollbar";
import { useEd } from "../lib/styles";
import type { FormData, SectionField } from "../types";
import type { PickedCompany } from "./company-picker";
import type { PickedCourse } from "./course-picker";
import { SectionForm } from "./section-form";

export function SectionItemModal({
  control,
  disabled,
  fields,
  onCancel,
  onCompanyPick,
  onCoursePick,
  onRolePick,
  onDelete,
  onSave,
  readOnlyKeys,
  saveDisabled,
  t,
  title,
  visible,
}: {
  control: Control<FormData>;
  disabled: boolean;
  fields: SectionField[];
  onCancel: () => void;
  onCompanyPick?: ((company: PickedCompany | null) => void) | undefined;
  onCoursePick?: ((course: PickedCourse | null) => void) | undefined;
  onRolePick?: ((seniority: string | null) => void) | undefined;
  onDelete?: (() => void) | undefined;
  onSave: () => void;
  readOnlyKeys?: ReadonlySet<string> | undefined;
  saveDisabled: boolean;
  t: (key: string) => string;
  title: string;
  visible: boolean;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const theme = useThemeName();
  const { height: windowHeight } = useWindowDimensions();
  useEffect(ensureSectionModalScrollbar, []);
  const brand = authDialogPalette[theme].brand;
  const onAccent = navFilled[theme].onFill;
  const form = (
    <SectionForm
      control={control}
      fields={fields}
      readOnlyKeys={readOnlyKeys}
      onCompanyPick={onCompanyPick}
      onCoursePick={onCoursePick}
      onRolePick={onRolePick}
    />
  );

  const requestClose = (): void => {
    if (!disabled) onCancel();
  };
  const header = (
    <ModalHeader
      title={title}
      compactOnMobile
      closeLabel={t("app.confirmDialog.close")}
      closeDisabled={disabled}
      onClose={requestClose}
    />
  );

  return (
    <Sheet
      open={visible}
      onOpenChange={(next) => {
        if (!next) requestClose();
      }}
      closeLabel={t("app.confirmDialog.close")}
      presentation="card"
      webMaxWidth={720}
      webMaxHeight={Math.min(720, windowHeight * 0.8)}
    >
      <YStack flexShrink={1} minHeight={0} paddingHorizontal={8} paddingTop={8}>
        <YStack flexShrink={0} paddingBottom={24}>
          {header}
        </YStack>
        <ScrollView
          {...(Platform.OS === "web" ? { dataSet: { sectionModalScroll: "" } } : {})}
          style={ed.editorialModalScroll}
          contentContainerStyle={ed.editorialModalScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {form}
        </ScrollView>
        <XStack
          flexShrink={0}
          alignItems="center"
          justifyContent="space-between"
          gap={12}
          paddingTop={16}
          borderTopWidth={1}
          borderColor={authTokens.hairline}
        >
          {onDelete ? (
            <Button
              variant="ghost"
              intent="danger"
              size="sm"
              borderRadius={7}
              color={authTokens.danger}
              disabled={disabled}
              onPress={onDelete}
            >
              {t("common.delete")}
            </Button>
          ) : (
            <YStack />
          )}
          <XStack alignItems="center" gap={12}>
            <Button
              variant="ghost"
              intent="neutral"
              size="sm"
              borderRadius={7}
              color={authTokens.muted}
              disabled={disabled}
              onPress={requestClose}
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              minWidth={104}
              borderRadius={7}
              backgroundColor={brand}
              borderColor={brand}
              color={onAccent}
              disabled={saveDisabled || disabled}
              loading={disabled}
              accessibilityLabel={t("common.save")}
              onPress={onSave}
            >
              {disabled ? <ActivityIndicator size="small" color={onAccent} /> : t("common.save")}
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </Sheet>
  );
}
