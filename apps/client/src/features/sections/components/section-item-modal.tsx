/**
 * Full-screen item editor modal for a section entry (extracted verbatim from
 * `SectionItemEditor`'s MultiItemEditorModal so the resume section manager
 * shares the exact same editor chrome). Slides up over the host list.
 */
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import type { Control } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useEd } from "../lib/styles";
import type { FormData, SectionField } from "../types";
import type { PickedCompany } from "./company-picker";
import type { PickedCourse } from "./course-picker";
import { GhostButton, OverlayModal } from "./primitives";
import { SectionForm } from "./section-form";

export function SectionItemModal({
  control,
  disabled,
  fields,
  onCancel,
  onCompanyPick,
  onCoursePick,
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
  return (
    <OverlayModal visible={visible} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={ed.editorModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tap outside the card to dismiss */}
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          onPress={onCancel}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <Text style={ed.editorModalTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
              hitSlop={12}
              onPress={onCancel}
            >
              <X size={22} color={authTokens.muted} />
            </Pressable>
          </View>
          <ScrollView
            style={ed.flex}
            contentContainerStyle={ed.editorModalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <SectionForm
              control={control}
              fields={fields}
              readOnlyKeys={readOnlyKeys}
              onCompanyPick={onCompanyPick}
              onCoursePick={onCoursePick}
            />
          </ScrollView>
          <View style={ed.editorModalFooter}>
            {onDelete ? (
              <GhostButton
                danger
                label={t("common.delete")}
                onPress={onDelete}
                disabled={disabled}
              />
            ) : (
              <View />
            )}
            <PrimaryAction label={t("common.save")} onPress={onSave} disabled={saveDisabled} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </OverlayModal>
  );
}
