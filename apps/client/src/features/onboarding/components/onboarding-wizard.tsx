import { FieldError, PrimaryAction } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, View } from "react-native";
import { isDevTestFillEnabled } from "@/config/dev-flags";
import { GhostButton, SectionItemEditor, useEd } from "@/features/sections";
import { useColorSchemeStore } from "@/providers/color-scheme";
import { countedIndexOf, countedTotal, prevFlowStep } from "../lib/flow-plan";
import { getSavedItemsForStep, isResumeStyleStep, isSectionStep } from "../lib/helpers";
import { isProfileFieldRequired } from "../lib/profile-validation";
import { suggestHeadlinesFromExperience } from "../lib/suggestions";
import { useOnboardingFlow } from "../model/use-onboarding-flow";
import { useTestFill } from "../model/use-test-fill";
import { WizardStoreProvider } from "../model/wizard-store-context";
import type { OnboardingField } from "../types";
import { sectionArtFor } from "./onboarding-art";
import { TestFillBar } from "./test-fill-bar";
import {
  BodyScrollBar,
  CenteredState,
  Masthead,
  RetryBanner,
  StepHeading,
  StepTransition,
} from "./wizard-chrome";
import {
  CompletionScreen,
  LanguageStep,
  LinksEditor,
  ResumeStylePicker,
  ReviewSummary,
  StepContext,
  StepForm,
  ThemeStep,
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
  const ed = useEd();
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
    setFlowStepId,
    editStep,
    editStepId,
    currentStep,
    flowFields,
    stepIsEmpty,
    formData,
    setFormData,
    items,
    setItems,
    errors,
    setErrors,
    phoneCountryIso,
    setPhoneCountry,
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
    commitSave,
    markWelcomeSeenAndAdvance,
    completed,
    finishOnboarding,
  } = useOnboardingFlow();

  const scheme = useColorSchemeStore((s) => s.scheme);
  const setScheme = useColorSchemeStore((s) => s.setScheme);

  // Body scroll metrics for the editorial scrollbar (BodyScrollBar): the body
  // is a fixed-height box, so overflow is invisible without an indicator.
  // The offset is stored with the step key it belongs to — a step change
  // remounts the keyed ScrollView at y=0, so a stale offset reads as 0.
  const headingKey = `${flowStepId}:${editStepId ?? ""}`;
  const [bodyScroll, setBodyScroll] = useState({ key: "", y: 0 });
  const bodyScrollY = bodyScroll.key === headingKey ? bodyScroll.y : 0;
  const [bodyContentHeight, setBodyContentHeight] = useState(0);
  const [bodyViewportHeight, setBodyViewportHeight] = useState(0);

  // Direction of the step transition, set by the navigation that caused the
  // step change (the mount-keyed StepTransition reads it on mount).
  const directionRef = useRef<1 | -1>(1);
  const goNext = (): void => {
    directionRef.current = 1;
    void handleNext();
  };
  const goBack = (): void => {
    directionRef.current = -1;
    handleBack();
  };

  // Single-choice steps (language/theme) auto-advance shortly after a tap —
  // a short beat lets the selection land visibly before the flow moves on.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );
  const selectAndAdvance = (apply: () => void): void => {
    apply();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goNext, 320);
  };

  // DEV-only test-fill engine. Hook is always called (no conditional hooks);
  // the UI is gated by `isDevTestFillEnabled()` so it never renders in prod.
  const testFill = useTestFill({
    session,
    saveStep: (stepId, payload) =>
      commitSave(stepId, payload as Parameters<typeof commitSave>[1], false),
    setFlowStepId,
    setFormData,
    setItems,
    setLocale,
    setScheme,
  });

  // Post-complete payoff: shown before the auth flag flips (bootstrap runs on
  // the CTA), so the route guard doesn't unmount the wizard mid-moment.
  if (completed) {
    return (
      <CompletionScreen
        locale={locale}
        styleId={session?.resumeStyleId}
        t={t}
        onDone={finishOnboarding}
      />
    );
  }

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
    return (
      <WelcomeScreen
        t={t}
        onStart={markWelcomeSeenAndAdvance}
        onBack={prevFlowStep(flowStepId) ? goBack : undefined}
      />
    );
  }

  const isLocal = !editStep && flowStep.kind === "local";
  const isReview = !editStep && flowStep.kind === "review";
  const showComplete = isReview;
  const isOptionalFlow = !showComplete && !isLocal && !editStep && flowStep.optional;
  const showBack = Boolean(editStep) || Boolean(prevFlowStep(flowStepId));
  // Requiredness: a field is required when the contract's complete-time schema
  // requires it (`isProfileFieldRequired` — e.g. `summary`, even though the
  // session marks it optional) OR the backend flags it on the session field.
  // `validateStepFields` uses the same rule, so the label and the gate agree.
  const fieldIsRequired = (field: OnboardingField): boolean =>
    isProfileFieldRequired(field.key) || Boolean(field.required);
  // Only the exceptions get marked: optional fields carry an "· opcional"
  // suffix, required fields show the bare label.
  const labeledFields = flowFields.map((field) =>
    fieldIsRequired(field)
      ? field
      : { ...field, label: `${field.label} · ${t("onboarding.field.optional")}` },
  );
  // Honest CTA: an optional step left empty is skipped by the primary action,
  // and the button says so. The CTA is never disabled — pressing it validates
  // (handleNext) and surfaces inline errors instead of a dead button.
  const showSkipCta = isOptionalFlow && stepIsEmpty;

  // Tappable headline suggestions from the saved work experience — shown as
  // chips under the empty field instead of silently pre-filling it.
  const workStep = session.steps.find((step) => step.sectionTypeKey === "work_experience_v1");
  const headlineSuggestions =
    !editStep && flowStepId === "headline"
      ? suggestHeadlinesFromExperience(getSavedItemsForStep(session, workStep))
      : [];

  const total = countedTotal();
  const stepNumber = editStep ? total : countedIndexOf(flowStepId) + 1;
  const stepTitle = editStep ? editStep.label : t(flowStep.titleKey);
  const stepSubtitle = editStep
    ? (editStep.description ?? "")
    : t(flowStep.titleKey.replace(".title", ".subtitle"));
  // A subtitle key that isn't translated falls back to the raw key path — hide it.
  const subtitleText = stepSubtitle.startsWith("onboarding.flow.") ? "" : stepSubtitle;

  // Tighten gutters on small phones; cap the column to the available width.
  const horizontalPadding = width > 0 && width < 375 ? 20 : 28;
  const columnMaxWidth = width > 0 ? Math.min(460, width - horizontalPadding * 2) : 460;
  // The body gets one fixed height for ALL steps so the masthead and footer
  // never shift between steps — short steps just center their content in it,
  // taller steps scroll within it. Scaled to the viewport, clamped for sanity.
  const bodyHeight = height > 0 ? Math.max(300, Math.min(440, Math.round(height * 0.46))) : 380;

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
            {editStep || !flowStep.hideMasthead ? (
              <Masthead
                counter={`${stepNumber} / ${total}`}
                progressPct={(stepNumber / total) * 100}
              />
            ) : null}

            <StepTransition key={headingKey} direction={directionRef.current}>
              {isDevTestFillEnabled() && !editStep ? (
                <TestFillBar
                  flowStepId={flowStepId}
                  onFillStep={() => testFill.fillStep(flowStepId, currentStep)}
                  onFillAll={() => void testFill.fillAll()}
                  disabled={isPending || testFill.isRunning}
                />
              ) : null}
              <StepHeading title={stepTitle} subtitle={subtitleText} />
            </StepTransition>

            {/* Fixed-height body: same on every step. Content centers inside it;
                if a step is taller than the box, it scrolls within the box —
                with the editorial scrollbar signalling the overflow. */}
            <View style={[ed.body, { height: bodyHeight }]}>
              <ScrollView
                key={`scroll:${headingKey}`}
                style={ed.flex}
                contentContainerStyle={ed.bodyScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) =>
                  setBodyScroll({ key: headingKey, y: event.nativeEvent.contentOffset.y })
                }
                onContentSizeChange={(_w, h) => setBodyContentHeight(h)}
                onLayout={(event) => setBodyViewportHeight(event.nativeEvent.layout.height)}
              >
                <StepTransition key={`body:${headingKey}`} direction={directionRef.current}>
                  {isLocal ? (
                    flowStepId === "theme" ? (
                      <ThemeStep
                        scheme={scheme}
                        onSelect={(next) => selectAndAdvance(() => setScheme(next))}
                        t={t}
                      />
                    ) : (
                      <LanguageStep
                        locale={locale}
                        onSelect={(next) => selectAndAdvance(() => setLocale(next))}
                        t={t}
                      />
                    )
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
                    <>
                      <ResumeStylePicker
                        step={currentStep}
                        selectedId={formData.resumeStyleId ?? session.resumeStyleId ?? ""}
                        t={t}
                        onSelect={(resumeStyleId) => {
                          setFormData({ resumeStyleId });
                          setErrors({});
                        }}
                      />
                      {errors.resumeStyleId ? <FieldError text={errors.resumeStyleId} /> : null}
                    </>
                  ) : isSectionStep(currentStep) ? (
                    <SectionItemEditor
                      step={currentStep}
                      items={items}
                      onChange={setItems}
                      isPending={isPending}
                      art={sectionArtFor(currentStep.sectionTypeKey)}
                      t={t}
                    />
                  ) : !editStep && flowStepId === "links" ? (
                    <LinksEditor fields={flowFields} data={formData} onChange={setFormData} t={t} />
                  ) : (
                    <StepForm
                      fields={labeledFields}
                      data={formData}
                      errors={errors}
                      onChange={setFormData}
                      onSubmit={goNext}
                      phoneCountryIso={phoneCountryIso}
                      onPhoneCountry={setPhoneCountry}
                      {...(headlineSuggestions.length > 0
                        ? { suggestions: { key: "headline", values: headlineSuggestions } }
                        : {})}
                    />
                  )}

                  <StepContext
                    flowStepId={flowStepId}
                    formData={formData}
                    session={session}
                    t={t}
                  />
                </StepTransition>
              </ScrollView>
              <BodyScrollBar
                contentHeight={bodyContentHeight}
                viewportHeight={bodyViewportHeight}
                scrollY={bodyScrollY}
              />
            </View>

            <View style={ed.footer}>
              {showBack ? (
                <GhostButton label={t("onboarding.back")} onPress={goBack} disabled={isPending} />
              ) : (
                <View />
              )}
              {/* Local single-choice steps auto-advance on tap — no CTA. The
                  CTA is otherwise always pressable (never a dead button):
                  pressing it validates and surfaces inline errors. */}
              {isLocal ? null : showComplete ? (
                <PrimaryAction
                  label={t("onboarding.complete")}
                  loading={complete.isPending}
                  disabled={isPending}
                  onPress={handleComplete}
                  testID="onboarding.complete"
                />
              ) : (
                <PrimaryAction
                  label={
                    editStep
                      ? t("common.save")
                      : showSkipCta
                        ? t("onboarding.skipCta")
                        : t("onboarding.next")
                  }
                  loading={nextStep.isPending || gotoStep.isPending}
                  disabled={isPending}
                  onPress={goNext}
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
