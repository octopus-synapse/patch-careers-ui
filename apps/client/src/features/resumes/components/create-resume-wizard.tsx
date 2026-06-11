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
import { Check, ChevronLeft, X } from "lucide-react-native";
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
import { useRz } from "../lib/styles";

const LANGUAGES = [
  { value: "pt-br", label: "Português" },
  { value: "en", label: "English" },
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
  onClose,
  onCreated,
}: {
  visible: boolean;
  /** Resume to copy from — the master on the list tab, any resume on detail. */
  sourceResumeId: string | undefined;
  onClose: () => void;
  onCreated: (resumeId: string) => void;
}): ReactElement {
  const ed = useEd();
  const rz = useRz();
  const styles = stylesByTheme[useThemeName()];
  const palette = useEditorialPalette();
  const { locale } = useI18n();
  const { visible: masterSections } = useResumeSections(visible ? sourceResumeId : undefined);
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
      setError("Não foi possível criar o currículo. Tente novamente.");
    }
  };

  const checkbox = (checked: boolean): ReactElement => (
    <View style={[rz.checkBox, checked && rz.checkBoxChecked]}>
      {checked ? <Check size={12} color={palette.surface} strokeWidth={3} /> : null}
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
          accessibilityLabel="Cancelar"
          onPress={close}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <View style={styles.headerLead}>
              {step === 2 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                  hitSlop={12}
                  onPress={() => setStep(1)}
                >
                  <ChevronLeft size={22} color={palette.muted} />
                </Pressable>
              ) : null}
              <View>
                <Text style={rz.wizardStepLabel}>{step} / 2</Text>
                <Text style={ed.editorModalTitle}>
                  {step === 1 ? "O que entra nesse currículo?" : "Detalhes do currículo"}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={12}
              onPress={close}
            >
              <X size={22} color={palette.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={ed.flex}
            contentContainerStyle={ed.editorModalScroll}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 ? (
              <View>
                <Text style={rz.wizardHint}>
                  Tudo vem do seu currículo principal. Desmarque o que não deve aparecer — a cópia
                  vive a própria vida depois.
                </Text>
                {copyable.map((section) => {
                  const picked = effective.get(section.key) ?? new Set<string>();
                  const allChecked = picked.size === section.items.length && picked.size > 0;
                  return (
                    <View key={section.key} style={rz.checkSection}>
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: allChecked }}
                        onPress={() => toggleSection(section)}
                        style={rz.checkRow}
                      >
                        {checkbox(allChecked)}
                        <Text style={[rz.checkLabel, rz.checkLabelSection]}>{section.title}</Text>
                        <Text style={rz.checkMeta}>
                          {picked.size}/{section.items.length}
                        </Text>
                      </Pressable>
                      {section.items.map((item) => {
                        if (!item.id) return null;
                        const checked = picked.has(item.id);
                        const { primary } = itemCardParts(item, locale);
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked }}
                            onPress={() => item.id && toggleItem(section.key, item.id)}
                            style={[rz.checkRow, rz.checkRowNested]}
                          >
                            {checkbox(checked)}
                            <Text style={rz.checkLabel} numberOfLines={1}>
                              {primary}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
                {copyable.length === 0 ? (
                  <Text style={rz.centeredText}>
                    Seu currículo principal ainda não tem itens para copiar.
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.detailsStack}>
                <UnderlineInput
                  label="Nome do currículo"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="ex.: Backend Sênior — fintech"
                />
                <View style={styles.fieldBlock}>
                  <Text style={rz.sectionLabel}>Idioma</Text>
                  <View style={ed.pillWrap}>
                    {LANGUAGES.map((lang) => (
                      <OptionPill
                        key={lang.value}
                        label={lang.label}
                        selected={language === lang.value}
                        onPress={() => setLanguage(lang.value)}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.fieldBlock}>
                  <Text style={rz.sectionLabel}>Estilo visual</Text>
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
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={rz.wizardHint}>
                    Sem escolha, a cópia mantém o estilo do currículo principal.
                  </Text>
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>
            )}
          </ScrollView>

          <View style={ed.editorModalFooter}>
            <View />
            {step === 1 ? (
              <PrimaryAction
                label="Continuar"
                onPress={() => setStep(2)}
                disabled={copyable.length === 0}
              />
            ) : (
              <PrimaryAction
                label="Criar currículo"
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
    detailsStack: { gap: 26 },
    fieldBlock: { gap: 12 },
    error: { fontFamily: fonts.sans, fontSize: 13, color: p.danger },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
