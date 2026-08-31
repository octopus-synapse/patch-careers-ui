/**
 * Onboarding step renderers — the body the wizard switches between per step:
 * the dynamic field form, language pick, supportive step context, the
 * resume-style picker (+ live preview modal), the review hub, and the welcome
 * intro. Extracted from onboarding-wizard.tsx; the wizard just routes to these.
 */
import {
  useGetV1OnboardingSessionResumePreview,
  useGetV1ResumeStyles,
} from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import type { ColorScheme } from "@patch-careers/state";
import { PhoneInput } from "@patch-careers/ui";
import {
  AnimatedField,
  FieldError,
  PrimaryAction,
  UnderlineInput,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Minus,
  MonitorSmartphone,
  Moon,
  Sun,
  X,
} from "lucide-react-native";
import { type ReactElement, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text as RNText,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  type TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { StyleScoreBadge } from "@/components/style-score-badge";
import { AddRow, FieldRenderer, OptionPill, OverlayModal, useEd } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import type { FlowStepId } from "../lib/flow-plan";
import {
  buildReviewSections,
  missingRequiredTargets,
  parseResumeStyles,
  visibleFields,
} from "../lib/helpers";
import type {
  FormData,
  OnboardingField,
  OnboardingSession,
  OnboardingStep,
  ResumeStyleOption,
  ReviewSection,
} from "../types";
import { LocationPicker } from "./location-picker";
import { WelcomeArt } from "./onboarding-art";
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
  const authTokens = useEditorialPalette();
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
    <View style={ed.langWrap}>
      {options.map((option, index) => {
        const selected = locale === option.value;
        return (
          <AnimatedField key={option.value} delay={120 + index * 80}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t("onboarding.language.prompt")}
              onPress={() => onSelect(option.value)}
              style={[ed.langCard, selected ? ed.langCardSelected : null]}
            >
              <View style={ed.langText}>
                <RNText style={ed.langLabel}>{option.native}</RNText>
                <RNText style={ed.langHint}>{option.hint}</RNText>
              </View>
              {selected ? <Check size={18} color={authTokens.ink} strokeWidth={2} /> : null}
            </Pressable>
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

// Public profile link, shown as a live preview on the username step.
const PROFILE_URL_HOST = "patchcareers.com";

function LinkPreview({
  handle,
  host,
  label,
}: {
  handle: string;
  host: string;
  label: string;
}): ReactElement {
  const ed = useEd();
  return (
    <View style={ed.linkCard}>
      <RNText style={ed.linkCardLabel}>{label}</RNText>
      <RNText style={ed.linkUrl} numberOfLines={1}>
        {host}/<RNText style={ed.linkHandle}>@{handle}</RNText>
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
      <LinkPreview
        host={PROFILE_URL_HOST}
        handle={handle}
        label={t("onboarding.flow.username.linkLabel")}
      />
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

export function ResumeStylePicker({
  onSelect,
  selectedId,
  step,
  t,
}: {
  onSelect: (id: string) => void;
  selectedId: string;
  step: OnboardingStep;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const stylesList = parseResumeStyles(step);
  // Live Style Scores from the catalog (replaces the step payload's stale
  // hardcoded ATS number), keyed by style id.
  const stylesQuery = useGetV1ResumeStyles();
  const scoreById = new Map<string, number>(
    (stylesQuery.data?.items ?? []).map((s) => [s.id, s.styleScore]),
  );
  // Tapping a card opens a full-screen preview; selection happens there.
  const [previewId, setPreviewId] = useState<string | null>(null);
  if (stylesList.length === 0) {
    return (
      <StepForm
        fields={visibleFields(step)}
        data={selectedId ? { resumeStyleId: selectedId } : {}}
        errors={{}}
        onChange={(data) => onSelect(data.resumeStyleId ?? "")}
      />
    );
  }
  const previewed = stylesList.find((style) => style.id === previewId) ?? null;
  return (
    <View style={ed.styleStack}>
      {stylesList.map((style, index) => (
        <AnimatedField key={style.id} delay={120 + index * 70}>
          <ResumeStyleCard
            option={style}
            liveScore={scoreById.get(style.id)}
            selected={style.id === selectedId}
            previewHint={t("onboarding.resumeStyle.previewHint")}
            onPress={() => setPreviewId(style.id)}
          />
        </AnimatedField>
      ))}
      <ResumeStyleModal
        option={previewed}
        selected={previewed?.id === selectedId}
        t={t}
        onClose={() => setPreviewId(null)}
        onUse={(id) => {
          onSelect(id);
          setPreviewId(null);
        }}
      />
    </View>
  );
}

function ResumeStyleCard({
  onPress,
  option,
  liveScore,
  previewHint,
  selected,
}: {
  onPress: () => void;
  option: ResumeStyleOption;
  liveScore?: number | undefined;
  previewHint: string;
  selected: boolean;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[ed.styleCard, selected ? ed.styleCardSelected : null]}
    >
      {option.thumbnailUrl ? (
        <Image source={{ uri: option.thumbnailUrl }} style={ed.styleImage} />
      ) : null}
      <View style={ed.styleBody}>
        <View style={ed.styleNameRow}>
          <RNText style={ed.styleName}>{option.name}</RNText>
          {selected ? <Check size={16} color={authTokens.ink} strokeWidth={2} /> : null}
        </View>
        {typeof liveScore === "number" ? (
          <StyleScoreBadge styleId={option.id} styleScore={liveScore} />
        ) : null}
        <RNText style={ed.stylePreviewHint}>{previewHint}</RNText>
      </View>
    </Pressable>
  );
}

/** Live HTML preview of the user's IN-PROGRESS resume rendered in the
 *  candidate style (`GET …/onboarding/session/resume-preview`) — the user's
 *  real onboarding data, not the baked sample. Same realtime AST→HTML the
 *  Resume tab shows: embedded via `srcDoc` on web and `WebView` on native.
 *  The hook only mounts while the modal is open (parent guards on `option`),
 *  so the render isn't kicked off until the user actually opens a preview.
 *  `styleId` is the tapped card's style, so switching styles re-renders. */
function StylePreview({ option }: { option: ResumeStyleOption }): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const { locale } = useI18n();
  const preview = useGetV1OnboardingSessionResumePreview(
    { styleId: option.id, locale },
    { query: { refetchOnWindowFocus: false, staleTime: 5 * 60_000 } },
  );
  const html = preview.data?.html;
  // Native only: flips when the REAL document finished loading, so the spinner
  // overlay also hides the blank placeholder page (avoids a white flash).
  const [docReady, setDocReady] = useState(false);

  if (preview.isError || (!preview.isLoading && !html)) {
    return (
      <View style={[ed.modalPreview, ed.modalPreviewEmpty, ed.modalPreviewCenter]}>
        <RNText style={ed.modalPreviewHint}>Pré-visualização indisponível.</RNText>
      </View>
    );
  }
  return (
    <View style={ed.modalPreview}>
      {Platform.OS === "web" ? (
        html ? (
          // RNW renders the host <iframe> through react-dom; `srcDoc` embeds
          // the document inline (no cross-origin / presigned-URL hop).
          <iframe
            srcDoc={html}
            title={option.name}
            style={
              {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              } as unknown as undefined
            }
          />
        ) : null
      ) : (
        // Android can't composite a chromium WebView ATTACHED to a Modal
        // window after that window is already on screen — mounting the
        // WebView only after the fetch resolved left the first open blank
        // (a cached reopen mounted it together with the Modal and worked).
        // Mount it with the modal and swap the document in once it arrives.
        <WebView
          originWhitelist={["*"]}
          source={{ html: html ?? "<!DOCTYPE html><html><body></body></html>" }}
          style={StyleSheet.absoluteFill}
          onLoadEnd={() => html && setDocReady(true)}
        />
      )}
      {!html || (Platform.OS !== "web" && !docReady) ? (
        <View style={[ed.modalPreviewEmpty, ed.modalPreviewCenter, StyleSheet.absoluteFill]}>
          <ActivityIndicator color={authTokens.ink} />
        </View>
      ) : null}
    </View>
  );
}

/** Non-interactive embedded resume document (web iframe / native WebView). */
function PreviewFrame({ html }: { html: string }): ReactElement {
  return Platform.OS === "web" ? (
    <iframe
      srcDoc={html}
      title="preview"
      style={
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        } as unknown as undefined
      }
    />
  ) : (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={StyleSheet.absoluteFill}
      scrollEnabled={false}
    />
  );
}

/** Live preview of the user's real resume in the selected style — the review
 *  hub's hero ("this exists because of you"). Same endpoint/data as the modal
 *  preview (shares the query cache); the A4 page auto-fits via the document's
 *  own fit script. `pointerEvents="none"` keeps the surface inert. */
function ReviewStylePreview({ styleId }: { styleId: string }): ReactElement | null {
  const ed = useEd();
  const { locale } = useI18n();
  const preview = useGetV1OnboardingSessionResumePreview(
    { styleId, locale },
    { query: { refetchOnWindowFocus: false, staleTime: 5 * 60_000 } },
  );
  const html = preview.data?.html;
  if (!html) return null;
  return (
    <View style={ed.reviewPreviewBox} pointerEvents="none">
      <PreviewFrame html={html} />
    </View>
  );
}

/** Preview of a resume template (item: resume-style modal). Centered card
 *  over a scrim — same size/positioning as the add-education/experience
 *  editor (`MultiItemEditorModal`). Selection is confirmed here. */
function ResumeStyleModal({
  onClose,
  onUse,
  option,
  selected,
  t,
}: {
  onClose: () => void;
  onUse: (id: string) => void;
  option: ResumeStyleOption | null;
  selected: boolean;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <OverlayModal visible={Boolean(option)} onRequestClose={onClose}>
      <View style={ed.editorModalOverlay}>
        {/* Tap outside the card to dismiss */}
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={onClose}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <RNText style={ed.editorModalTitle}>{option?.name ?? ""}</RNText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="close"
              hitSlop={12}
              onPress={onClose}
            >
              <X size={22} color={authTokens.muted} />
            </Pressable>
          </View>
          <ScrollView style={ed.flex} contentContainerStyle={ed.modalScroll}>
            {option ? <StylePreview option={option} /> : null}
          </ScrollView>
          <View style={ed.modalFooter}>
            <PrimaryAction
              label={selected ? t("common.save") : t("onboarding.resumeStyle.use")}
              onPress={() => option && onUse(option.id)}
            />
          </View>
        </View>
      </View>
    </OverlayModal>
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
  const activated = new Set(session.activatedExtras ?? []);
  const options = (session.availableExtras ?? [])
    .filter((extra) => !activated.has(extra.id))
    .map((extra) => ({ id: extra.id, label: extra.label, icon: extra.icon }));
  // Right column of a checklist row: the chosen style's name, an item count
  // for multi-item sections, "—" for skipped ones, nothing for form steps.
  const rowValue = (section: ReviewSection): string => {
    if (section.styleName) return section.styleName;
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

      {/* The resume itself leads — the payoff the flow has been building to. */}
      {session.resumeStyleId ? (
        <AnimatedField delay={100}>
          <View style={ed.reviewHero}>
            <ReviewStylePreview styleId={session.resumeStyleId} />
          </View>
        </AnimatedField>
      ) : null}

      <AnimatedField delay={160}>
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
          label={t("onboarding.addSection")}
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
          onAddSection(id);
        }}
        title={t("onboarding.addSection")}
      />
    </View>
  );
}

/** Value-prop intro shown before the counted flow (item: welcome screen). */
export function WelcomeScreen({
  onStart,
  onBack,
  t,
}: {
  onStart: () => void;
  /** Back to the preceding step (theme); omitted when there's nowhere to go. */
  onBack?: (() => void) | undefined;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={ed.root}>
      {/* Absolute so the centered cluster below keeps its exact position
          whether or not there is somewhere to go back to. `top` comes from the
          inset because the surrounding SafeAreaView doesn't pad on Android. */}
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.back")}
          onPress={onBack}
          hitSlop={12}
          style={[ed.welcomeBack, { top: insets.top + (Platform.OS === "web" ? 20 : 8) }]}
          testID="onboarding.welcome.back"
        >
          <ArrowLeft size={22} color={authTokens.ink} strokeWidth={1.75} />
          {Platform.OS === "web" ? (
            <RNText style={ed.welcomeBackLabel}>{t("onboarding.back").toUpperCase()}</RNText>
          ) : null}
        </Pressable>
      ) : null}
      <View style={ed.welcomeWrap}>
        <AnimatedField delay={140}>
          <View style={ed.welcomeArt}>
            <WelcomeArt size={148} />
          </View>
        </AnimatedField>
        <AnimatedField delay={220}>
          <RNText style={ed.welcomeHeading}>
            <RNText style={ed.headingRegular}>{t("onboarding.title")} </RNText>
          </RNText>
        </AnimatedField>
        <AnimatedField delay={300}>
          <RNText style={ed.welcomeTagline}>{t("onboarding.welcome.tagline")}</RNText>
        </AnimatedField>
        <AnimatedField delay={400}>
          <View style={ed.welcomeCta}>
            <PrimaryAction
              label={t("onboarding.welcome.cta")}
              onPress={onStart}
              testID="onboarding.welcome.start"
            />
          </View>
        </AnimatedField>
      </View>
    </SafeAreaView>
  );
}

/** Post-complete payoff screen — the narrative close the welcome opens: the
 *  finished resume plus one CTA into the app. Shown BEFORE the auth flag
 *  flips (bootstrap runs on the CTA), so the onboarding route guard doesn't
 *  yank the user away mid-moment. The preview is a cache-only read: the
 *  review step already rendered it, and post-complete the session endpoint
 *  may reject, so this never fetches (`enabled: false`). */
export function CompletionScreen({
  locale,
  onDone,
  styleId,
  t,
}: {
  locale: Locale;
  onDone: () => Promise<void>;
  styleId: string | null | undefined;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const [busy, setBusy] = useState(false);
  const preview = useGetV1OnboardingSessionResumePreview(
    { styleId: styleId ?? "", locale },
    { query: { enabled: false } },
  );
  const html = styleId ? preview.data?.html : undefined;
  return (
    <SafeAreaView style={ed.root}>
      <View style={ed.welcomeWrap}>
        {html ? (
          <AnimatedField delay={120}>
            <View style={ed.reviewPreviewBox} pointerEvents="none">
              <PreviewFrame html={html} />
            </View>
          </AnimatedField>
        ) : null}
        <AnimatedField delay={240}>
          <RNText style={ed.welcomeHeading}>{t("onboarding.done.title")}</RNText>
        </AnimatedField>
        <AnimatedField delay={340}>
          <View style={ed.welcomeCta}>
            <PrimaryAction
              label={t("onboarding.done.cta")}
              loading={busy}
              onPress={() => {
                setBusy(true);
                void onDone().finally(() => setBusy(false));
              }}
              testID="onboarding.done"
            />
          </View>
        </AnimatedField>
      </View>
    </SafeAreaView>
  );
}
