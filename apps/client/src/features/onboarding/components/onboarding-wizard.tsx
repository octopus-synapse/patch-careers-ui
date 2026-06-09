import { FieldError, PrimaryAction } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, View } from "react-native";
import { ed, GhostButton, SectionItemEditor } from "@/features/sections";
import {
  countedIndexOf,
  countedTotal,
  estimatedRemainingMinutes,
  phaseForFlowStep,
  prevFlowStep,
} from "../lib/flow-plan";
import { canContinueStep, isResumeStyleStep, isSectionStep } from "../lib/helpers";
import { isProfileFieldRequired } from "../lib/profile-validation";
import { useOnboardingFlow } from "../model/use-onboarding-flow";
import { WizardStoreProvider } from "../model/wizard-store-context";
import type { OnboardingField } from "../types";
import { sectionArtFor } from "./onboarding-art";
import {
  AckCheckbox,
  CenteredState,
  Masthead,
  ResumeBanner,
  RetryBanner,
  StepHeading,
} from "./wizard-chrome";
import {
  LanguageStep,
  ResumeStylePicker,
  ReviewSummary,
  StepContext,
  StepForm,
  WelcomeScreen,
} from "./wizard-steps";

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

// Chrome, step renderers and the resume-style cluster live in
// ./wizard-chrome and ./wizard-steps.
