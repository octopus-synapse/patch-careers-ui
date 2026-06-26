/**
 * Create-resume wizard — derives a NEW resume from the master as a snapshot
 * copy that diverges (POST /v1/resumes/:id/duplicate). Two panes:
 *
 *   1. checklist of the master's sections/items to include (sections with
 *      zero items have nothing to copy and aren't listed);
 *   2. title + language + visual style.
 *
 * On success the caller receives the new resume id (it pushes the detail).
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import {
  editorialFonts as fonts,
  PrimaryAction,
  UnderlineInput,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { Check, ChevronLeft, Minus, X } from "lucide-react-native";
import { type ReactElement, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StyleScoreBadge } from "@/components/style-score-badge";
import {
  itemCardParts,
  type MergedSection,
  OptionPill,
  OverlayModal,
  useEd,
  useResumeSections,
} from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import { useResumeMutations, useResumeStyles } from "../hooks/queries";
import { resumeLanguageToLocale } from "../lib/helpers";
import { useRz } from "../lib/styles";

const LANGUAGES = [
  { value: "pt-br", labelKey: "resumes.wizard.languagePt" },
  { value: "en", labelKey: "resumes.wizard.languageEn" },
] as const;

type Selection = Map<string, Set<string>>;

function buildInitialSelection(sections: MergedSection[]): Selection {
  const selection: Selection = new Map();
  for (const section of sections) {
    if (section.items.length === 0) continue;
    selection.set(
      section.key,
      new Set(section.items.map((item) => item.id).filter((id): id is string => Boolean(id))),
    );
  }
  return selection;
}

export function CreateResumeWizard({
  visible,
  sourceResumeId,
  sourceLanguage,
  onClose,
  onCreated,
}: {
  visible: boolean;
  /** Resume to copy from — the master on the list tab, any resume on detail. */
  sourceResumeId: string | undefined;
  /** Source resume's language — localizes the section checklist. */
  sourceLanguage?: string | undefined;
  onClose: () => void;
  onCreated: (resumeId: string) => void;
}): ReactElement {
  const ed = useEd();
  const rz = useRz();
  const styles = stylesByTheme[useThemeName()];
  const palette = useEditorialPalette();
  const { t, locale } = useI18n();
  const { visible: masterSections } = useResumeSections(
    visible ? sourceResumeId : undefined,
    resumeLanguageToLocale(sourceLanguage),
  );
  const stylesQuery = useResumeStyles();
  const { duplicateResume, isPending } = useResumeMutations();

  const copyable = useMemo(
    () => masterSections.filter((section) => section.items.length > 0),
    [masterSections],
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<string>("pt-br");
  const [styleId, setStyleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Seed the checklist with everything selected once the data arrives.
  const effective = selection ?? buildInitialSelection(copyable);

  // Live totals for the recap line (only copyable items carry an id).
  const totalItems = copyable.reduce(
    (sum, section) => sum + section.items.filter((item) => item.id).length,
    0,
  );
  let selectedItems = 0;
  for (const section of copyable) selectedItems += effective.get(section.key)?.size ?? 0;

  const toggleItem = (sectionKey: string, itemId: string): void => {
    const next = new Map(effective);
    const items = new Set(next.get(sectionKey) ?? []);
    if (items.has(itemId)) items.delete(itemId);
    else items.add(itemId);
    next.set(sectionKey, items);
    setSelection(next);
  };

  const toggleSection = (section: MergedSection): void => {
    const next = new Map(effective);
    const current = next.get(section.key) ?? new Set<string>();
    const allIds = section.items.map((item) => item.id).filter((id): id is string => Boolean(id));
    next.set(section.key, current.size === allIds.length ? new Set() : new Set(allIds));
    setSelection(next);
  };

  const reset = (): void => {
    setStep(1);
    setSelection(null);
    setTitle("");
    setLanguage("pt-br");
    setStyleId(null);
    setError(null);
  };

  const close = (): void => {
    reset();
    onClose();
  };

  const create = async (): Promise<void> => {
    if (!sourceResumeId || title.trim().length === 0) return;
    const include = [...effective.entries()]
      .filter(([, items]) => items.size > 0)
      .map(([sectionTypeKey, items]) => ({ sectionTypeKey, itemIds: [...items] }));
    setError(null);
    try {
      const id = await duplicateResume(sourceResumeId, {
        title: title.trim(),
        language,
        ...(styleId ? { styleId } : {}),
        include,
      });
      reset();
      onCreated(id);
    } catch {
      setError(t("resumes.wizard.createError"));
    }
  };

  // off → empty · partial → minus (only the master row) · on → filled check
  const checkbox = (state: "off" | "partial" | "on"): ReactElement => (
    <View style={[rz.checkBox, state === "on" && rz.checkBoxChecked]}>
      {state === "on" ? <Check size={14} color={palette.surface} strokeWidth={3} /> : null}
      {state === "partial" ? <Minus size={14} color={palette.ink} strokeWidth={3} /> : null}
    </View>
  );

  return (
    <OverlayModal visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView
        style={ed.editorModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("resumes.wizard.cancel")}
          onPress={close}
        />
        <View style={rz.wizardCard}>
          <View style={rz.progressTrack}>
            <View style={step === 1 ? rz.progressFillHalf : rz.progressFillFull} />
          </View>
          <View style={ed.editorModalHeader}>
            <View style={styles.headerLead}>
              {step === 2 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("resumes.wizard.back")}
                  hitSlop={12}
                  onPress={() => setStep(1)}
                >
                  <ChevronLeft size={22} color={palette.muted} />
                </Pressable>
              ) : null}
              <Text style={[ed.editorModalTitle, styles.headerTitle]} numberOfLines={2}>
                {step === 1 ? t("resumes.wizard.step1Title") : t("resumes.wizard.step2Title")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("resumes.wizard.close")}
              hitSlop={12}
              onPress={close}
            >
              <X size={22} color={palette.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={rz.wizardScroll}
            contentContainerStyle={ed.editorModalScroll}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 ? (
              <View>
                <Text style={rz.wizardHint}>{t("resumes.wizard.step1Hint")}</Text>
                {copyable.length > 0 ? (
                  <>
                    <View style={rz.checklist}>
                      {copyable.map((section) => {
                        const picked = effective.get(section.key) ?? new Set<string>();
                        const total = section.items.filter((item) => item.id).length;
                        const master =
                          picked.size === 0 ? "off" : picked.size >= total ? "on" : "partial";
                        return (
                          <View key={section.key} style={rz.secCard}>
                            <Pressable
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: master === "on" }}
                              onPress={() => toggleSection(section)}
                              style={rz.secHeader}
                            >
                              {checkbox(master)}
                              <View style={rz.secHeaderText}>
                                <Text style={rz.secTitle}>{section.title}</Text>
                              </View>
                              <Text style={rz.secCount}>
                                {picked.size}/{total}
                              </Text>
                            </Pressable>
                            {section.items.map((item) => {
                              if (!item.id) return null;
                              const checked = picked.has(item.id);
                              const { primary, meta } = itemCardParts(item, locale);
                              return (
                                <Pressable
                                  key={item.id}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked }}
                                  onPress={() => item.id && toggleItem(section.key, item.id)}
                                  style={rz.itemRow}
                                >
                                  {checkbox(checked ? "on" : "off")}
                                  <View style={[rz.itemBody, !checked && rz.itemRowOff]}>
                                    <Text style={rz.itemPrimary} numberOfLines={1}>
                                      {primary}
                                    </Text>
                                    {meta ? (
                                      <Text style={rz.itemMeta} numberOfLines={1}>
                                        {meta}
                                      </Text>
                                    ) : null}
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                    <View style={rz.recapRow}>
                      <View style={rz.recapDot} />
                      <Text style={rz.recapText}>
                        {t("resumes.wizard.recap", { count: selectedItems, total: totalItems })}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={rz.centered}>
                    <Text style={rz.centeredText}>{t("resumes.wizard.emptyMaster")}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.detailsStack}>
                <UnderlineInput
                  label={t("resumes.wizard.nameLabel")}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t("resumes.wizard.namePlaceholder")}
                />
                <View style={styles.fieldBlock}>
                  <Text style={rz.sectionLabel}>{t("resumes.wizard.languageLabel")}</Text>
                  <View style={ed.pillWrap}>
                    {LANGUAGES.map((lang) => (
                      <OptionPill
                        key={lang.value}
                        label={t(lang.labelKey)}
                        selected={language === lang.value}
                        onPress={() => setLanguage(lang.value)}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.fieldBlock}>
                  <Text style={rz.sectionLabel}>{t("resumes.wizard.styleLabel")}</Text>
                  <View style={ed.styleStack}>
                    {(stylesQuery.data?.items ?? []).map((style) => {
                      const selected = styleId === style.id;
                      return (
                        <Pressable
                          key={style.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => setStyleId(selected ? null : style.id)}
                          style={[ed.styleCard, selected && ed.styleCardSelected]}
                        >
                          {style.thumbnailUrl ? (
                            <Image source={{ uri: style.thumbnailUrl }} style={ed.styleImage} />
                          ) : (
                            <View style={ed.styleImage} />
                          )}
                          <View style={ed.styleBody}>
                            <Text style={ed.styleName}>{style.name}</Text>
                            {style.description ? (
                              <Text style={ed.styleDesc} numberOfLines={2}>
                                {style.description}
                              </Text>
                            ) : null}
                            <StyleScoreBadge styleId={style.id} styleScore={style.styleScore} />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={rz.wizardHint}>{t("resumes.wizard.styleHint")}</Text>
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>
            )}
          </ScrollView>

          <View style={ed.editorModalFooter}>
            <View />
            {step === 1 ? (
              <PrimaryAction
                label={t("resumes.wizard.continue")}
                onPress={() => setStep(2)}
                disabled={copyable.length === 0}
              />
            ) : (
              <PrimaryAction
                label={t("resumes.wizard.create")}
                onPress={() => void create()}
                loading={isPending}
                disabled={title.trim().length === 0 || isPending}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </OverlayModal>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    headerLead: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 12 },
    headerTitle: { flex: 1 },
    detailsStack: { gap: 26 },
    fieldBlock: { gap: 12 },
    error: { fontFamily: fonts.sans, fontSize: 13, color: p.danger },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
