/**
 * Onboarding step renderers — the body the wizard switches between per step:
 * the dynamic field form, language pick, supportive step context, the
 * resume-style picker (+ live preview modal), the review hub, and the welcome
 * intro. Extracted from onboarding-wizard.tsx; the wizard just routes to these.
 */
import { useGetV1OnboardingSessionResumePreview } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import type { ColorScheme } from "@patch-careers/state";
import { PhoneInput } from "@patch-careers/ui";
import {
  AnimatedField,
  PatchLogo,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { Check, Minus, MonitorSmartphone, Moon, Sun, X } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text as RNText,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { AddRow, FieldRenderer, OverlayModal, useEd } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import type { FlowStepId } from "../lib/flow-plan";
import {
  atsBand,
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
} from "../types";
import { LocationPicker } from "./location-picker";
import { WelcomeArt } from "./onboarding-art";
import { SectionAddPicker } from "./section-add-picker";
import { MissingBanner } from "./wizard-chrome";

export function StepForm({
  data,
  errors,
  fields,
  onChange,
  phoneCountryIso,
  onPhoneCountry,
}: {
  data: FormData;
  errors: Record<string, string>;
  // The exact fields to render — a slice of the backend step owned by the
  // current flow step (the wizard splits one backend step across screens).
  fields: OnboardingField[];
  onChange: (data: FormData) => void;
  // Phone country is owned by the wizard so it survives the location → personal
  // hop and reloads; falls back to local state for forms without a phone field.
  phoneCountryIso?: string | undefined;
  onPhoneCountry?: (iso: string) => void;
}): ReactElement {
  const ed = useEd();
  const [localCountryIso, setLocalCountryIso] = useState<string | undefined>(undefined);
  const countryIso = phoneCountryIso ?? localCountryIso;
  const setCountryIso = onPhoneCountry ?? setLocalCountryIso;
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
          node = (
            <FieldRenderer
              field={field}
              value={data[field.key] ?? ""}
              {...errorProps}
              onChange={(value) => onChange({ ...data, [field.key]: value })}
            />
          );
        }
        return (
          <AnimatedField key={field.key} delay={120 + index * 70}>
            {node}
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
  const options: ReadonlyArray<{ value: Locale; label: string; native: string; hint: string }> = [
    {
      value: "en",
      label: "English",
      native: "English",
      hint: "Interface, dates & content in English",
    },
    {
      value: "pt-BR",
      label: "Português",
      native: "Português (Brasil)",
      hint: "Interface, datas e conteúdo em português",
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

function ContextNote({ body, label }: { body: string; label: string }): ReactElement {
  const ed = useEd();
  return (
    <View>
      <View style={ed.contextRule} />
      <RNText style={ed.contextLabel}>{label}</RNText>
      <RNText style={ed.contextBody}>{body}</RNText>
    </View>
  );
}

function LinkPreview({
  handle,
  host,
  label,
  note,
}: {
  handle: string;
  host: string;
  label: string;
  note: string;
}): ReactElement {
  const ed = useEd();
  return (
    <View style={ed.linkCard}>
      <RNText style={ed.linkCardLabel}>{label}</RNText>
      <RNText style={ed.linkUrl} numberOfLines={1}>
        {host}/<RNText style={ed.linkHandle}>@{handle}</RNText>
      </RNText>
      <RNText style={ed.linkNote}>{note}</RNText>
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
  if (flowStepId === "username") {
    const handle = (formData.username ?? session.username ?? "").trim();
    if (!handle) return null;
    return (
      <View style={ed.context}>
        <LinkPreview
          host={PROFILE_URL_HOST}
          handle={handle}
          label={t("onboarding.flow.username.linkLabel")}
          note={t("onboarding.flow.username.linkNote")}
        />
      </View>
    );
  }
  if (flowStepId === "location" || flowStepId === "personal") {
    return (
      <View style={ed.context}>
        <ContextNote
          label={t(`onboarding.flow.${flowStepId}.contextLabel`)}
          body={t(`onboarding.flow.${flowStepId}.contextNote`)}
        />
      </View>
    );
  }
  return null;
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
  previewHint,
  selected,
}: {
  onPress: () => void;
  option: ResumeStyleOption;
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
        {option.description ? <RNText style={ed.styleDesc}>{option.description}</RNText> : null}
        {option.atsScore ? <RNText style={ed.styleAts}>ATS {option.atsScore}/100</RNText> : null}
        <RNText style={ed.stylePreviewHint}>{previewHint}</RNText>
      </View>
    </Pressable>
  );
}

/** Live HTML preview of the user's IN-PROGRESS résumé rendered in the
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

/** Compact, non-interactive live thumbnail of the user's real résumé in the
 *  selected style — replaces the generic style thumbnail in the review card.
 *  Same endpoint/data as the modal preview (shares the query cache). The A4
 *  page auto-fits to this tiny box via the document's own fit script.
 *  `pointerEvents="none"` keeps the parent review card tappable. */
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
    <View style={[ed.reviewImage, ed.reviewPreviewBox]} pointerEvents="none">
      {Platform.OS === "web" ? (
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
      )}
    </View>
  );
}

/** Preview of a résumé template + ATS-band explanation (item: resume-style
 *  modal). Centered card over a scrim — same size/positioning as the
 *  add-education/experience editor (`MultiItemEditorModal`). Selection is
 *  confirmed here. */
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
  const band = atsBand(option?.atsScore);
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
            {band ? (
              <View style={ed.atsSeal}>
                <RNText style={ed.atsSealLabel}>
                  {option?.atsScore ? `${option.atsScore}/100 · ` : ""}
                  {t(`onboarding.ats.${band}.label`)}
                </RNText>
                <RNText style={ed.atsSealBlurb}>{t(`onboarding.ats.${band}.blurb`)}</RNText>
              </View>
            ) : null}
            {option?.description ? (
              <RNText style={ed.modalDesc}>{option.description}</RNText>
            ) : null}
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
  t: (key: string) => string;
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
  return (
    <View>
      {missing.length > 0 ? <MissingBanner targets={missing} onFix={onEdit} t={t} /> : null}
      {sections.map((section, index) => (
        <AnimatedField key={section.stepId} delay={100 + index * 50}>
          <Pressable style={ed.reviewCard} onPress={() => onEdit(section.stepId)}>
            <View style={ed.reviewHead}>
              {section.skipped ? (
                <Minus size={13} color={authTokens.subtle} />
              ) : (
                <Check size={13} color={authTokens.success} strokeWidth={2.5} />
              )}
              <RNText style={ed.reviewLabel}>{section.label}</RNText>
            </View>
            {section.skipped ? (
              <RNText style={ed.reviewSkipped}>—</RNText>
            ) : section.styleName ? (
              <View style={ed.reviewStyleRow}>
                {session.resumeStyleId ? (
                  // Live thumbnail of the user's real résumé in the selected
                  // style — falls back to the generic style thumbnail.
                  <ReviewStylePreview styleId={session.resumeStyleId} />
                ) : section.stylePreviewUrl ? (
                  <Image source={{ uri: section.stylePreviewUrl }} style={ed.reviewImage} />
                ) : null}
                <RNText style={ed.reviewStyleName}>{section.styleName}</RNText>
              </View>
            ) : (
              <View>
                {section.entries.map((entry) => (
                  <View key={`${entry.label}:${entry.value}`} style={ed.reviewEntry}>
                    {entry.label ? (
                      <RNText style={ed.reviewEntryLabel}>{entry.label}</RNText>
                    ) : null}
                    <RNText
                      style={[ed.reviewEntryValue, entry.long ? ed.reviewEntryLong : null]}
                      numberOfLines={entry.long ? 4 : 2}
                    >
                      {entry.value}
                    </RNText>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        </AnimatedField>
      ))}

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
  t,
}: {
  onStart: () => void;
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <SafeAreaView style={ed.root}>
      <View style={ed.welcomeWrap}>
        <AnimatedField delay={60}>
          <PatchLogo size={42} />
        </AnimatedField>
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
        <AnimatedField delay={360}>
          <View style={ed.welcomeBadge}>
            <Check size={14} color={authTokens.accent} strokeWidth={2.5} />
            <RNText style={ed.welcomeBadgeText}>{t("onboarding.welcome.timePromise")}</RNText>
          </View>
        </AnimatedField>
        <AnimatedField delay={440}>
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
