/**
 * Onboarding step renderers — the body the wizard switches between per step:
 * the dynamic field form, language pick, supportive step context, review hub,
 * and review hub. Extracted from onboarding-wizard.tsx; the wizard just routes to these.
 */
import type { Locale, Translator } from "@patch-careers/i18n";
import type { ColorScheme } from "@patch-careers/state";
import { PhoneInput } from "@patch-careers/ui";
import {
  AnimatedField,
  FieldError,
  LanguageOptionCard,
  PrimaryAction,
  UnderlineInput,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { Check, ChevronRight, Minus, MonitorSmartphone, Moon, Sun, X } from "lucide-react-native";
import { type ReactElement, useRef, useState } from "react";
import { Pressable, Text as RNText, type TextInput, View } from "react-native";
import { AddRow, FieldRenderer, OptionPill, OverlayModal, useEd } from "@/features/sections";
import { publicProfileDisplayUrl } from "@/lib/public-profile-url";
import type { FlowStepId } from "../lib/flow-plan";
import { buildReviewSections, missingRequiredTargets } from "../lib/helpers";
import type {
  FormData,
  OnboardingField,
  OnboardingSession,
  OnboardingStep,
  ReviewSection,
} from "../types";
import { LocationPicker } from "./location-picker";
import { SectionAddPicker } from "./section-add-picker";
import { MissingBanner } from "./wizard-chrome";

/** Fields whose text input can join the keyboard focus chain. */
function isTypedField(field: OnboardingField): boolean {
  return field.key !== "location" && field.key !== "phone" && !field.options?.length;
}

export function StepForm({
  data,
  errors,
  fields,
  onChange,
  onSubmit,
  phoneCountryIso,
  onPhoneCountry,
  suggestions,
}: {
  data: FormData;
  errors: Record<string, string>;
  // The exact fields to render — a slice of the backend step owned by the
  // current flow step (the wizard splits one backend step across screens).
  fields: OnboardingField[];
  onChange: (data: FormData) => void;
  /** Keyboard submit on the last text field advances the step. */
  onSubmit?: (() => void) | undefined;
  // Phone country is owned by the wizard so it survives the location → personal
  // hop and reloads; falls back to local state for forms without a phone field.
  phoneCountryIso?: string | undefined;
  onPhoneCountry?: (iso: string) => void;
  /** Tappable value suggestions rendered under the matching (empty) field. */
  suggestions?: { key: string; values: string[] } | undefined;
}): ReactElement {
  const ed = useEd();
  const [localCountryIso, setLocalCountryIso] = useState<string | undefined>(undefined);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const countryIso = phoneCountryIso ?? localCountryIso;
  const setCountryIso = onPhoneCountry ?? setLocalCountryIso;
  const typedKeys = fields.filter(isTypedField).map((field) => field.key);
  // Focus the first field when the step opens with the cursor ready — only
  // when it's an actual text input (never a picker, which would pop a modal).
  const autoFocusKey = fields[0] && isTypedField(fields[0]) ? fields[0].key : undefined;
  return (
    <View style={ed.fieldStack}>
      {fields.map((field, index) => {
        const fieldError = errors[field.key];
        const errorProps = fieldError ? { error: fieldError } : {};
        let node: ReactElement;
        if (field.key === "location") {
          node = (
            <LocationPicker
              label={field.label}
              value={data[field.key] ?? ""}
              onChange={(label, meta) => {
                onChange({ ...data, location: label });
                if (meta?.countryCode) setCountryIso(meta.countryCode);
              }}
              {...errorProps}
            />
          );
        } else if (field.key === "phone") {
          node = (
            <PhoneInput
              label={field.label}
              value={data[field.key] ?? ""}
              onChange={(value) => onChange({ ...data, phone: value })}
              onCountryChange={setCountryIso}
              {...(countryIso ? { defaultCountryIso: countryIso } : {})}
              {...errorProps}
            />
          );
        } else {
          // Chain the keyboard through the typed fields: "next" focuses the
          // following text input, the last one submits the step.
          const chainIndex = typedKeys.indexOf(field.key);
          const nextTypedKey = chainIndex >= 0 ? typedKeys[chainIndex + 1] : undefined;
          const isTextArea = field.type === "textarea";
          const keyboardProps =
            chainIndex < 0 || isTextArea
              ? {}
              : nextTypedKey
                ? {
                    returnKeyType: "next" as const,
                    onSubmitEditing: () => inputRefs.current[nextTypedKey]?.focus(),
                  }
                : onSubmit
                  ? { returnKeyType: "done" as const, onSubmitEditing: onSubmit }
                  : {};
          node = (
            <FieldRenderer
              field={field}
              value={data[field.key] ?? ""}
              {...errorProps}
              {...(field.key === autoFocusKey ? { autoFocus: true } : {})}
              inputRef={(el: TextInput | null) => {
                inputRefs.current[field.key] = el;
              }}
              {...keyboardProps}
              onChange={(value) => onChange({ ...data, [field.key]: value })}
            />
          );
        }
        const fieldSuggestions =
          suggestions?.key === field.key && !(data[field.key] ?? "").trim()
            ? suggestions.values
            : [];
        return (
          <AnimatedField key={field.key} delay={120 + index * 70}>
            {node}
            {fieldSuggestions.length > 0 ? (
              <View style={[ed.pillWrap, ed.suggestionRow]}>
                {fieldSuggestions.map((value) => (
                  <OptionPill
                    key={value}
                    label={value}
                    selected={false}
                    onPress={() => onChange({ ...data, [field.key]: value })}
                  />
                ))}
              </View>
            ) : null}
          </AnimatedField>
        );
      })}
    </View>
  );
}

export function LanguageStep({
  locale,
  onSelect,
  t,
}: {
  locale: Locale;
  onSelect: (locale: Locale) => void;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  // `hint` is written in each target language (like `native`), so it reads the
  // same regardless of the current UI locale — and it gives the short language
  // step enough body to fill the step without looking sparse.
  const options: ReadonlyArray<{
    value: Locale;
    label: string;
    native: string;
    hint: string;
  }> = [
    {
      value: "en",
      label: t("onboarding.language.english.native"),
      native: t("onboarding.language.english.native"),
      hint: t("onboarding.language.english.hint"),
    },
    {
      value: "pt-BR",
      label: t("onboarding.language.portuguese.native"),
      native: t("onboarding.language.portuguese.native"),
      hint: t("onboarding.language.portuguese.hint"),
    },
  ];
  return (
    <View style={[ed.langWrap, ed.languageChoiceWrap]}>
      {options.map((option, index) => {
        const selected = locale === option.value;
        return (
          <AnimatedField key={option.value} delay={120 + index * 80}>
            <LanguageOptionCard
              label={option.native}
              description={option.hint}
              selected={selected}
              size="large"
              accessibilityLabel={t("onboarding.language.prompt")}
              onPress={() => onSelect(option.value)}
            />
          </AnimatedField>
        );
      })}
    </View>
  );
}

const THEME_OPTIONS = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: MonitorSmartphone },
] as const;

/** Light/dark/system pick — a regular counted step: masthead, progress and
 *  the back/continue footer come from the wizard chrome, like every other
 *  step. Selecting an option writes the color-scheme store, so the whole app
 *  re-themes instantly: the step IS the preview. */
export function ThemeStep({
  scheme,
  onSelect,
  t,
}: {
  scheme: ColorScheme;
  onSelect: (scheme: ColorScheme) => void;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <View style={ed.langWrap}>
      {THEME_OPTIONS.map((option, index) => {
        const selected = scheme === option.value;
        const OptionIcon = option.icon;
        return (
          <AnimatedField key={option.value} delay={120 + index * 80}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`onboarding.theme.${option.value}.label`)}
              onPress={() => onSelect(option.value)}
              style={[ed.langCard, selected ? ed.langCardSelected : null]}
            >
              <OptionIcon size={20} color={authTokens.muted} strokeWidth={1.75} />
              <View style={ed.langText}>
                <RNText style={ed.langLabel}>{t(`onboarding.theme.${option.value}.label`)}</RNText>
                <RNText style={ed.langHint}>{t(`onboarding.theme.${option.value}.hint`)}</RNText>
              </View>
              {selected ? <Check size={18} color={authTokens.ink} strokeWidth={2} /> : null}
            </Pressable>
          </AnimatedField>
        );
      })}
    </View>
  );
}

/**
 * Public profile link, previewed live on the username step. The URL is built
 * by `lib/public-profile-url` so this preview and the profile page's own
 * "copy my link" card can never drift — they used to, on both the domain and
 * the path shape.
 */
function LinkPreview({ handle, label }: { handle: string; label: string }): ReactElement {
  const ed = useEd();
  const prefix = publicProfileDisplayUrl("");
  return (
    <View style={ed.linkCard}>
      <RNText style={ed.linkCardLabel}>{label}</RNText>
      <RNText style={ed.linkUrl} numberOfLines={1}>
        {prefix}
        <RNText style={ed.linkHandle}>{handle}</RNText>
      </RNText>
    </View>
  );
}

export function StepContext({
  flowStepId,
  formData,
  session,
  t,
}: {
  flowStepId: FlowStepId;
  formData: FormData;
  session: OnboardingSession;
  t: (key: string) => string;
}): ReactElement | null {
  const ed = useEd();
  if (flowStepId !== "username") return null;
  const handle = (formData.username ?? session.username ?? "").trim();
  if (!handle) return null;
  return (
    <View style={ed.context}>
      <LinkPreview handle={handle} label={t("onboarding.flow.username.linkLabel")} />
    </View>
  );
}

/** Links step — filled links render as quiet cards; a single "+ Adicionar
 *  link" affordance opens a compact modal (pick the platform → enter the
 *  URL), replacing four always-empty URL inputs. Values live in the same
 *  step form data, so persistence/validation are unchanged. */
export function LinksEditor({
  data,
  fields,
  onChange,
  t,
}: {
  data: FormData;
  fields: OnboardingField[];
  onChange: (data: FormData) => void;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [draftError, setDraftError] = useState("");

  const filled = fields.filter((field) => (data[field.key] ?? "").trim().length > 0);
  const empty = fields.filter((field) => !(data[field.key] ?? "").trim());
  const editingField = fields.find((field) => field.key === editingKey) ?? null;

  const openEditor = (key: string): void => {
    setDraftUrl((data[key] ?? "").trim());
    setDraftError("");
    setPickerOpen(false);
    setEditingKey(key);
  };
  const closeModal = (): void => {
    setPickerOpen(false);
    setEditingKey(null);
  };
  const saveDraft = (): void => {
    if (!editingField) return;
    const url = draftUrl.trim();
    // Validated here (same rule as the step validator) so a saved link can
    // never block "Continuar" with an error the step no longer renders.
    if (!/^https?:\/\/\S+/i.test(url)) {
      setDraftError(t("validation.invalidUrl"));
      return;
    }
    onChange({ ...data, [editingField.key]: url });
    closeModal();
  };
  const removeLink = (key: string): void => {
    const next = { ...data };
    delete next[key];
    onChange(next);
  };

  return (
    <View>
      {filled.length > 0 ? (
        <View style={ed.list}>
          {filled.map((field, index) => (
            <AnimatedField key={field.key} delay={120 + index * 70}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={field.label}
                onPress={() => openEditor(field.key)}
                style={ed.card}
              >
                <View style={ed.cardBody}>
                  <RNText style={ed.cardPrimary} numberOfLines={1}>
                    {field.label}
                  </RNText>
                  <RNText style={ed.cardMeta} numberOfLines={1}>
                    {data[field.key]}
                  </RNText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("onboarding.removeItem")}
                  onPress={() => removeLink(field.key)}
                  hitSlop={10}
                  style={ed.cardRemove}
                >
                  <X size={16} color={authTokens.muted} strokeWidth={1.75} />
                </Pressable>
              </Pressable>
            </AnimatedField>
          ))}
        </View>
      ) : null}

      {empty.length > 0 ? (
        <AnimatedField delay={filled.length > 0 ? 200 : 120}>
          <AddRow
            label={t("onboarding.links.add")}
            onPress={() => setPickerOpen(true)}
            style={filled.length > 0 ? ed.addRow : ed.addSection}
            {...(filled.length > 0 ? {} : { labelStyle: ed.addSectionLabel })}
          />
        </AnimatedField>
      ) : null}

      <OverlayModal visible={pickerOpen || Boolean(editingField)} onRequestClose={closeModal}>
        <Pressable style={ed.pickerOverlay} onPress={closeModal}>
          {/* Absorb taps inside the card so they don't dismiss it. */}
          <Pressable style={ed.pickerCard} onPress={() => undefined}>
            {editingField ? (
              <>
                <RNText style={ed.pickerTitle}>{editingField.label}</RNText>
                <UnderlineInput
                  label={t("sections.links.urlLabel")}
                  value={draftUrl}
                  onChangeText={(value) => {
                    setDraftUrl(value);
                    if (draftError) setDraftError("");
                  }}
                  placeholder={t("sections.links.urlPlaceholder")}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={saveDraft}
                  hasError={Boolean(draftError)}
                />
                {draftError ? <FieldError text={draftError} /> : null}
                <PrimaryAction label={t("common.save")} onPress={saveDraft} />
              </>
            ) : (
              <>
                <RNText style={ed.pickerTitle}>{t("onboarding.links.add")}</RNText>
                <View>
                  {empty.map((field) => (
                    <Pressable
                      key={field.key}
                      accessibilityRole="button"
                      accessibilityLabel={field.label}
                      onPress={() => openEditor(field.key)}
                      style={ed.linkKindRow}
                    >
                      <RNText style={ed.linkKindLabel}>{field.label}</RNText>
                      <ChevronRight size={18} color={authTokens.subtle} strokeWidth={1.75} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </OverlayModal>
    </View>
  );
}

export function ReviewSummary({
  addPending,
  onAddSection,
  onEdit,
  session,
  steps,
  t,
}: {
  addPending: boolean;
  onAddSection: (extraId: string) => void;
  onEdit: (stepId: string) => void;
  session: OnboardingSession;
  steps: OnboardingStep[];
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const sections = buildReviewSections(session, steps);
  const missing = missingRequiredTargets(session);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sectionSteps = steps.filter((step) => Boolean(step.sectionTypeKey));
  const sectionStepIds = new Set(sectionSteps.map((step) => step.id));
  const catalogSteps = [
    ...sectionSteps,
    ...(session.availableExtras ?? []).filter((extra) => !sectionStepIds.has(extra.id)),
  ];
  const itemCountByKey = new Map(
    (session.sections ?? []).map((section) => [
      section.sectionTypeKey,
      section.noData ? 0 : (section.items?.length ?? 0),
    ]),
  );
  const options = catalogSteps.map((step) => ({
    id: step.id,
    label: step.label,
    description: step.description,
    count: step.sectionTypeKey ? (itemCountByKey.get(step.sectionTypeKey) ?? 0) : 0,
  }));
  // Right column of a checklist row: the chosen style's name, an item count
  // for multi-item sections, "—" for skipped ones, nothing for form steps.
  const rowValue = (section: ReviewSection): string => {
    if (section.skipped) return "—";
    if (typeof section.count === "number") {
      return section.count === 1
        ? t("onboarding.review.itemsOne")
        : t("onboarding.review.items", { count: section.count });
    }
    return "";
  };
  return (
    <View>
      {missing.length > 0 ? <MissingBanner targets={missing} onFix={onEdit} t={t} /> : null}

      <AnimatedField delay={100}>
        <View style={ed.reviewList}>
          {sections.map((section) => (
            <Pressable
              key={section.stepId}
              accessibilityRole="button"
              accessibilityLabel={section.label}
              onPress={() => onEdit(section.stepId)}
              style={ed.reviewRow}
            >
              {section.skipped ? (
                <Minus size={13} color={authTokens.subtle} />
              ) : (
                <Check size={13} color={authTokens.success} strokeWidth={2.5} />
              )}
              <RNText style={ed.reviewRowLabel} numberOfLines={1}>
                {section.label}
              </RNText>
              <RNText style={ed.reviewRowValue} numberOfLines={1}>
                {rowValue(section)}
              </RNText>
            </Pressable>
          ))}
        </View>
      </AnimatedField>

      {options.length > 0 ? (
        <AddRow
          label={t("sections.addToResume")}
          onPress={() => setPickerOpen(true)}
          disabled={addPending}
          loading={addPending}
          iconSize={14}
          style={[ed.addSection, addPending ? ed.dim : null]}
          labelStyle={ed.addSectionLabel}
        />
      ) : null}

      <SectionAddPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        options={options}
        onPick={(id) => {
          setPickerOpen(false);
          if (sectionStepIds.has(id)) onEdit(id);
          else onAddSection(id);
        }}
      />
    </View>
  );
}
