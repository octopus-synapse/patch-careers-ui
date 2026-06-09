import { useGetV1OnboardingSessionResumePreview } from "@patch-careers/api-client";
import type { Locale, Translator } from "@patch-careers/i18n";
import { editorialPalette as authTokens } from "@patch-careers/tokens";
import { PhoneInput } from "@patch-careers/ui";
import { AnimatedField, FieldError, PatchLogo, PrimaryAction } from "@patch-careers/ui/editorial";
import { Check, Minus, X } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text as RNText,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import WebView from "react-native-webview";
import {
  AddRow,
  ed,
  FieldRenderer,
  GhostButton,
  OverlayModal,
  SectionItemEditor,
} from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import {
  countedIndexOf,
  countedTotal,
  estimatedRemainingMinutes,
  type FlowStepId,
  phaseForFlowStep,
  prevFlowStep,
} from "../lib/flow-plan";
import {
  atsBand,
  buildReviewSections,
  canContinueStep,
  isResumeStyleStep,
  isSectionStep,
  missingRequiredTargets,
  parseResumeStyles,
  visibleFields,
} from "../lib/helpers";
import { isProfileFieldRequired } from "../lib/profile-validation";
import { useOnboardingFlow } from "../model/use-onboarding-flow";
import { WizardStoreProvider } from "../model/wizard-store-context";
import type {
  FormData,
  OnboardingField,
  OnboardingSession,
  OnboardingStep,
  ResumeStyleOption,
} from "../types";
import { LocationPicker } from "./location-picker";
import { sectionArtFor, WelcomeArt } from "./onboarding-art";
import { SectionAddPicker } from "./section-add-picker";
import {
  AckCheckbox,
  CenteredState,
  Masthead,
  MissingBanner,
  ResumeBanner,
  RetryBanner,
  StepHeading,
} from "./wizard-chrome";

export function OnboardingWizard(): ReactElement {
  // Scope the draft store to one wizard mount; it is discarded on exit.
  return (
    <WizardStoreProvider>
      <OnboardingWizardInner />
    </WizardStoreProvider>
  );
}

function OnboardingWizardInner(): ReactElement {
  const {
    locale,
    t,
    setLocale,
    width,
    height,
    sessionQuery,
    fallbackSession,
    session,
    flowStep,
    flowStepId,
    editStep,
    editStepId,
    currentStep,
    flowFields,
    activeFieldKeys,
    stepIsEmpty,
    formData,
    setFormData,
    items,
    setItems,
    errors,
    setErrors,
    noItemsAck,
    setNoItemsAck,
    phoneCountryIso,
    setPhoneCountry,
    resumeBanner,
    saveError,
    completeError,
    isPending,
    nextStep,
    gotoStep,
    extras,
    complete,
    retryLoad,
    handleNext,
    handleBack,
    handleGoto,
    handleComplete,
    handleAddSection,
    retrySave,
    dismissResumeBanner,
    markWelcomeSeenAndAdvance,
  } = useOnboardingFlow();

  if (sessionQuery.isLoading && !fallbackSession) {
    return <CenteredState label={t("common.loading")} />;
  }

  if (!session || !flowStep) {
    return (
      <CenteredState
        label={sessionQuery.isFetching ? t("common.loading") : t("onboarding.loadFailed")}
        actionLabel={t("common.retry")}
        onAction={() => void retryLoad()}
      />
    );
  }

  // Welcome intro: its own centered layout, outside the counted progress.
  if (!editStep && flowStep.intro) {
    return <WelcomeScreen t={t} onStart={markWelcomeSeenAndAdvance} />;
  }

  const isLocal = !editStep && flowStep.kind === "local";
  const isReview = !editStep && flowStep.kind === "review";
  const showComplete = isReview;
  const showSkip = !showComplete && !isLocal && !editStep && flowStep.optional;
  const showBack = Boolean(editStep) || Boolean(prevFlowStep(flowStepId));
  // Requiredness: a field is required when the contract's complete-time schema
  // requires it (`isProfileFieldRequired` — e.g. `summary`, even though the
  // session marks it optional) OR the backend flags it on the session field.
  // `validateStepFields` uses the same rule, so the label and the gate agree.
  const fieldIsRequired = (field: OnboardingField): boolean =>
    isProfileFieldRequired(field.key) || Boolean(field.required);
  // Suffix every label with its requiredness so each step always shows what's
  // obrigatório vs opcional.
  const labeledFields = flowFields.map((field) => ({
    ...field,
    label: `${field.label} · ${t(
      fieldIsRequired(field) ? "onboarding.field.required" : "onboarding.field.optional",
    )}`,
  }));
  const canContinue = ((): boolean => {
    if (editStep) return canContinueStep(editStep, formData, items);
    if (!currentStep) return true;
    // Optional empty steps (sections AND the links step) need an explicit
    // "skip this step" acknowledgement before "Continuar" unlocks — once an
    // item/field is filled the normal validation below takes over.
    if (showSkip && stepIsEmpty) return noItemsAck;
    if (isSectionStep(currentStep)) return items.length > 0;
    // Form/style steps: canContinueStep → validateStepFields enforces the
    // contract requiredness, so steps like "username" or the summary on the
    // headline step can't be left empty.
    return canContinueStep(currentStep, formData, items, activeFieldKeys);
  })();

  const total = countedTotal();
  const stepNumber = editStep ? total : countedIndexOf(flowStepId) + 1;
  const phase = phaseForFlowStep(editStep ? "review" : flowStepId);
  const stepTitle = editStep ? editStep.label : t(flowStep.titleKey);
  const stepSubtitle = editStep
    ? (editStep.description ?? "")
    : t(flowStep.titleKey.replace(".title", ".subtitle"));
  // A subtitle key that isn't translated falls back to the raw key path — hide it.
  const subtitleText = stepSubtitle.startsWith("onboarding.flow.") ? "" : stepSubtitle;
  const headingKey = `${flowStepId}:${editStepId ?? ""}`;

  // Tighten gutters on small phones; cap the column to the available width.
  const horizontalPadding = width > 0 && width < 375 ? 20 : 28;
  const columnMaxWidth = width > 0 ? Math.min(460, width - horizontalPadding * 2) : 460;
  // The body gets one fixed height for ALL steps so the masthead and footer
  // never shift between steps — short steps just center their content in it,
  // taller steps scroll within it. Scaled to the viewport, clamped for sanity.
  const bodyHeight = height > 0 ? Math.max(300, Math.min(440, Math.round(height * 0.46))) : 380;
  const remainingMin = editStep ? 1 : estimatedRemainingMinutes(flowStepId);

  return (
    <SafeAreaView style={ed.root}>
      <KeyboardAvoidingView
        style={ed.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Cluster centered in the viewport. The body below is a fixed height on
            every step, so the masthead and footer never shift between steps —
            only the body's own content moves (centered, or scrolled if taller). */}
        <View style={[ed.page, { paddingHorizontal: horizontalPadding }]}>
          <View style={[ed.column, { maxWidth: columnMaxWidth }]}>
            {resumeBanner ? (
              <ResumeBanner
                phaseLabel={resumeBanner.phaseLabel}
                onDismiss={dismissResumeBanner}
                t={t}
              />
            ) : null}
            <Masthead
              phaseLabel={phase ? t(phase.labelKey) : ""}
              timeText={t(
                remainingMin === 1
                  ? "onboarding.progress.timeRemainingOne"
                  : "onboarding.progress.timeRemaining",
                { min: remainingMin },
              )}
              progressPct={(stepNumber / total) * 100}
            />

            <View key={headingKey}>
              <StepHeading title={stepTitle} subtitle={subtitleText} />
            </View>

            {/* Fixed-height body: same on every step. Content centers inside it;
                if a step is taller than the box, it scrolls within the box. */}
            <View style={[ed.body, { height: bodyHeight }]}>
              <ScrollView
                style={ed.flex}
                contentContainerStyle={ed.bodyScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View key={`body:${headingKey}`}>
                  {isLocal ? (
                    <LanguageStep locale={locale} onSelect={setLocale} t={t} />
                  ) : isReview ? (
                    <ReviewSummary
                      session={session}
                      steps={session.steps}
                      onEdit={handleGoto}
                      onAddSection={(extraId) => void handleAddSection(extraId)}
                      addPending={extras.isPending || gotoStep.isPending}
                      t={t}
                    />
                  ) : !currentStep ? null : isResumeStyleStep(currentStep) ? (
                    <ResumeStylePicker
                      step={currentStep}
                      selectedId={formData.resumeStyleId ?? session.resumeStyleId ?? ""}
                      t={t}
                      onSelect={(resumeStyleId) => {
                        setFormData({ resumeStyleId });
                        setErrors({});
                      }}
                    />
                  ) : isSectionStep(currentStep) ? (
                    <SectionItemEditor
                      step={currentStep}
                      items={items}
                      onChange={setItems}
                      isPending={isPending}
                      art={sectionArtFor(currentStep.sectionTypeKey)}
                      t={t}
                    />
                  ) : (
                    <StepForm
                      fields={labeledFields}
                      data={formData}
                      errors={errors}
                      onChange={setFormData}
                      phoneCountryIso={phoneCountryIso}
                      onPhoneCountry={setPhoneCountry}
                    />
                  )}
                </View>

                <StepContext flowStepId={flowStepId} formData={formData} session={session} t={t} />

                {showSkip && stepIsEmpty ? (
                  <View style={ed.skipRow}>
                    <AckCheckbox
                      label={currentStep?.noDataLabel ?? t("onboarding.skip")}
                      checked={noItemsAck}
                      onToggle={() => setNoItemsAck((value) => !value)}
                      disabled={isPending}
                    />
                  </View>
                ) : null}
              </ScrollView>
            </View>

            <View style={ed.footer}>
              {showBack ? (
                <GhostButton
                  label={t("onboarding.back")}
                  onPress={handleBack}
                  disabled={isPending}
                />
              ) : (
                <View />
              )}
              {showComplete ? (
                <PrimaryAction
                  label={t("onboarding.complete")}
                  loading={complete.isPending}
                  disabled={isPending || Boolean(session.missingRequired?.length)}
                  onPress={handleComplete}
                  testID="onboarding.complete"
                />
              ) : (
                <PrimaryAction
                  label={editStep ? t("common.save") : t("onboarding.next")}
                  loading={nextStep.isPending || gotoStep.isPending}
                  disabled={isPending || !canContinue}
                  onPress={() => void handleNext()}
                  testID="onboarding.next"
                />
              )}
            </View>
            {saveError ? (
              <RetryBanner
                label={saveError}
                onRetry={() => void retrySave()}
                disabled={isPending}
              />
            ) : null}
            {completeError ? (
              <View style={ed.footerError}>
                <FieldError text={completeError} />
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────
// Forms
// ────────────────────────────────────────────────────────────

function StepForm({
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

function LanguageStep({
  locale,
  onSelect,
  t,
}: {
  locale: Locale;
  onSelect: (locale: Locale) => void;
  t: (key: string) => string;
}): ReactElement {
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

// ────────────────────────────────────────────────────────────
// Step context — supportive content that fills out the short steps so
// they read as intentional instead of a lone field floating in the box.
// ────────────────────────────────────────────────────────────

// Public profile link, shown as a live preview on the username step.
const PROFILE_URL_HOST = "patchcareers.com";

function ContextNote({ body, label }: { body: string; label: string }): ReactElement {
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

function StepContext({
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

// ────────────────────────────────────────────────────────────
// Resume style
// ────────────────────────────────────────────────────────────

function ResumeStylePicker({
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
  const { locale } = useI18n();
  const preview = useGetV1OnboardingSessionResumePreview(
    { styleId: option.id, locale },
    { query: { refetchOnWindowFocus: false, staleTime: 5 * 60_000 } },
  );
  const html = preview.data?.html;

  if (preview.isLoading) {
    return (
      <View style={[ed.modalPreview, ed.modalPreviewEmpty, ed.modalPreviewCenter]}>
        <ActivityIndicator color={authTokens.ink} />
      </View>
    );
  }
  if (preview.isError || !html) {
    return (
      <View style={[ed.modalPreview, ed.modalPreviewEmpty, ed.modalPreviewCenter]}>
        <RNText style={ed.modalPreviewHint}>Pré-visualização indisponível.</RNText>
      </View>
    );
  }
  return (
    <View style={ed.modalPreview}>
      {Platform.OS === "web" ? (
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
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={StyleSheet.absoluteFill}
          startInLoadingState
          renderLoading={() => (
            <View style={[ed.modalPreviewEmpty, ed.modalPreviewCenter, StyleSheet.absoluteFill]}>
              <ActivityIndicator color={authTokens.ink} />
            </View>
          )}
        />
      )}
    </View>
  );
}

/** Compact, non-interactive live thumbnail of the user's real résumé in the
 *  selected style — replaces the generic style thumbnail in the review card.
 *  Same endpoint/data as the modal preview (shares the query cache). The A4
 *  page auto-fits to this tiny box via the document's own fit script.
 *  `pointerEvents="none"` keeps the parent review card tappable. */
function ReviewStylePreview({ styleId }: { styleId: string }): ReactElement | null {
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

// ────────────────────────────────────────────────────────────
// Review hub
// ────────────────────────────────────────────────────────────

function ReviewSummary({
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

// ────────────────────────────────────────────────────────────
// Welcome, banners
// ────────────────────────────────────────────────────────────

/** Value-prop intro shown before the counted flow (item: welcome screen). */
function WelcomeScreen({ onStart, t }: { onStart: () => void; t: Translator }): ReactElement {
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
