/**
 * The single "add" entry point of the resume section manager: a modal that
 * first lists the whole section-type catalog (existing sections included —
 * adding a 2nd education also comes through here), then slides straight into
 * the item form for the picked type, with a back chevron to re-pick. Saving
 * creates the section implicitly (the items POST is keyed by sectionTypeKey)
 * plus the item in one flow.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import {
  editorialFonts as fonts,
  PrimaryAction,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSectionItemForm } from "../hooks/use-section-item-form";
import type { MergedSection } from "../lib/section-visibility";
import { useEd } from "../lib/styles";
import type { SectionItem } from "../types";
import { OverlayModal } from "./primitives";
import { SectionForm } from "./section-form";

/** Form pane — mounted per picked type (key={section.key}) so the RHF form
 *  and its cascades reset cleanly when the user re-picks. */
function AddItemForm({
  section,
  isPending,
  onSave,
  t,
}: {
  section: MergedSection;
  isPending: boolean;
  onSave: (item: SectionItem) => Promise<void>;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  const fields = section.descriptor.fields ?? [];
  const {
    form,
    derivedKeys,
    hasCompany,
    isEducation,
    handleCompanyPick,
    handleCoursePick,
    handleRolePick,
    hasErrors,
  } = useSectionItemForm(fields);

  const save = form.handleSubmit(async (values) => {
    await onSave({ content: { ...values } });
  });

  return (
    <>
      <ScrollView
        style={ed.flex}
        contentContainerStyle={ed.editorModalScroll}
        keyboardShouldPersistTaps="handled"
      >
        <SectionForm
          control={form.control}
          fields={fields}
          readOnlyKeys={derivedKeys}
          onCompanyPick={hasCompany ? handleCompanyPick : undefined}
          onCoursePick={isEducation ? handleCoursePick : undefined}
          onRolePick={hasCompany ? handleRolePick : undefined}
        />
      </ScrollView>
      <View style={ed.editorModalFooter}>
        <View />
        <PrimaryAction
          label={t("common.save")}
          onPress={() => void save()}
          disabled={hasErrors || isPending}
        />
      </View>
    </>
  );
}

export function AddSectionFlowModal({
  visible,
  onClose,
  catalog,
  onCreate,
  isPending,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  catalog: MergedSection[];
  /** Persist a new item for the picked type; resolves once committed. */
  onCreate: (section: MergedSection, item: SectionItem) => Promise<void>;
  isPending: boolean;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  const styles = stylesByTheme[useThemeName()];
  const authTokens = useEditorialPalette();
  const [picked, setPicked] = useState<MergedSection | null>(null);

  const close = (): void => {
    setPicked(null);
    onClose();
  };

  const save = async (item: SectionItem): Promise<void> => {
    if (!picked) return;
    await onCreate(picked, item);
    setPicked(null);
  };

  return (
    <OverlayModal visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView
        style={ed.editorModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tap outside the card to dismiss */}
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          onPress={close}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <View style={styles.headerLead}>
              {picked ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("common.back")}
                  hitSlop={12}
                  onPress={() => setPicked(null)}
                >
                  <ChevronLeft size={22} color={authTokens.muted} />
                </Pressable>
              ) : null}
              <Text style={ed.editorModalTitle} numberOfLines={1}>
                {picked ? picked.addLabel : t("sections.addToResume")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
              hitSlop={12}
              onPress={close}
            >
              <X size={22} color={authTokens.muted} />
            </Pressable>
          </View>

          {picked ? (
            <AddItemForm
              key={picked.key}
              section={picked}
              isPending={isPending}
              onSave={save}
              t={t}
            />
          ) : (
            <ScrollView style={ed.flex} contentContainerStyle={styles.catalogScroll}>
              {catalog.map((section) => (
                <Pressable
                  key={section.key}
                  accessibilityRole="button"
                  accessibilityLabel={section.title}
                  accessibilityState={{ disabled: section.atCapacity }}
                  disabled={section.atCapacity}
                  onPress={() => setPicked(section)}
                  style={({ pressed }) => [
                    styles.catalogRow,
                    pressed && styles.catalogRowPressed,
                    section.atCapacity && styles.catalogRowDisabled,
                  ]}
                >
                  <View style={styles.catalogBody}>
                    <View style={styles.catalogTitleRow}>
                      <Text style={styles.catalogTitle}>{section.title}</Text>
                      {section.items.length > 0 ? (
                        <Text style={styles.catalogCount}>{section.items.length}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.catalogDesc} numberOfLines={2}>
                      {section.atCapacity ? t("sections.atCapacity") : section.description}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={authTokens.subtle} strokeWidth={1.75} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </OverlayModal>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    headerLead: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 12 },
    catalogScroll: { paddingHorizontal: 24, paddingVertical: 12 },
    catalogRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    catalogRowPressed: { opacity: 0.7 },
    catalogRowDisabled: { opacity: 0.4 },
    catalogBody: { flex: 1, gap: 3 },
    catalogTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    catalogTitle: { fontFamily: fonts.serif, fontSize: 18, color: p.ink },
    catalogCount: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: p.subtle,
    },
    catalogDesc: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: p.muted },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
