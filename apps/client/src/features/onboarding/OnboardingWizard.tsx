import {
  getV1OnboardingSessionQueryKey,
  useGetV1OnboardingSession,
  useGetV1OnboardingSessionResumePreview,
  usePostV1OnboardingSessionComplete,
  usePostV1OnboardingSessionExtras,
  usePostV1OnboardingSessionGoto,
  usePostV1OnboardingSessionNext,
} from "@patch-careers/api-client";
import { bootstrap } from "@patch-careers/auth";
import type { Locale, Translator } from "@patch-careers/i18n";
import { editorialPalette as authTokens } from "@patch-careers/tokens";
import { PhoneInput } from "@patch-careers/ui";
import { AnimatedField, FieldError, PatchLogo, PrimaryAction } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { AlertCircle, Check, Minus, RefreshCw, X } from "lucide-react-native";
import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
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
  useWindowDimensions,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { translateBackendCode } from "@/components/auth/validation";
import {
  AddRow,
  ed,
  FieldRenderer,
  GhostButton,
  OverlayModal,
  SectionItemEditor,
} from "@/features/sections";
import { getCompletedOnboardingRoute } from "@/navigation/authRedirect";
import { useI18n } from "@/providers/i18n-provider";
import { LocationPicker } from "./components/LocationPicker";
import { SectionAddPicker } from "./components/SectionAddPicker";
import {
  countedIndexOf,
  countedTotal,
  estimatedRemainingMinutes,
  FLOW_PLAN,
  type FlowStep,
  type FlowStepId,
  flowIndexOf,
  nextFlowStep,
  phaseForFlowStep,
  prevFlowStep,
} from "./flow/flowPlan";
import { suggestHeadlineFromExperience } from "./flow/suggestions";
import {
  atsBand,
  backendStepForFlow,
  buildNextPayload,
  buildReviewSections,
  buildSkipPayload,
  canContinueStep,
  defaultCountryFromLocale,
  fieldsForFlowStep,
  flowStepForBackendStep,
  getSavedDataForStep,
  getSavedItemsForStep,
  isFormStepEmpty,
  isLastFlowStepForBackend,
  isResumeStyleStep,
  isSectionStep,
  type MissingRequiredTarget,
  missingRequiredTargets,
  parseResumeStyles,
  validateStepFields,
  visibleFields,
} from "./helpers";
import { sectionArtFor, WelcomeArt } from "./illustrations/OnboardingArt";
import { isProfileFieldRequired } from "./profileValidation";
import {
  clearResumeDismissed,
  clearSessionSnapshot,
  clearStepDraft,
  markResumeDismissed,
  markWelcomeSeen,
  readPhoneCountry,
  readResumeDismissed,
  readSessionSnapshot,
  readStepDraft,
  readWelcomeSeen,
  savePhoneCountry,
  saveSessionSnapshot,
  saveStepDraft,
} from "./storage";
import type {
  FormData,
  OnboardingField,
  OnboardingSession,
  OnboardingStep,
  ResumeStyleOption,
  SectionItem,
} from "./types";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== "object") return undefined;
  const status = (response as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function OnboardingWizard(): ReactElement {
  const { locale, t, setLocale } = useI18n();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionKey = useMemo(() => getV1OnboardingSessionQueryKey({ locale }), [locale]);
  const [fallbackSession, setFallbackSession] = useState<OnboardingSession | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [items, setItems] = useState<SectionItem[]>([]);
  // Optional section steps require an explicit acknowledgement ("I don't have
  // any X") to continue when empty — so the user can't blow past them blindly.
  const [noItemsAck, setNoItemsAck] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completeError, setCompleteError] = useState("");
  // App-owned flow cursor (drives which screen renders + which fields show).
  // Starts on the language pick; the welcome interstitial follows it (and is
  // skipped once seen).
  const [flowStepId, setFlowStepId] = useState<FlowStepId>("language");
  // When editing a section from the review hub, render that one backend step
  // directly (full fields) and return to review on save — extras (projects,
  // certs…) have no linear flow step, so this overlay covers them too.
  const [editStepId, setEditStepId] = useState<string | null>(null);
  // Phone country survives location → personal and reloads (item: sticky country).
  const [phoneCountryIso, setPhoneCountryIso] = useState<string | undefined>(undefined);
  // Backend step ids the user has tried (and failed) to submit — so re-entering
  // a step re-surfaces its errors instead of looking pristine.
  const [attemptedSteps, setAttemptedSteps] = useState<ReadonlySet<string>>(() => new Set());
  // Non-destructive save failure: keep the data, offer a retry.
  const [saveError, setSaveError] = useState("");
  // "Continue where you left off" banner shown once on a resumed session.
  const [resumeBanner, setResumeBanner] = useState<{ phaseLabel: string } | null>(null);
  const refreshedAuthRef = useRef(false);
  const resyncedStepRef = useRef(false);
  const welcomeSeenRef = useRef(false);
  const welcomeCheckedRef = useRef(false);
  const resumeDismissedRef = useRef(false);
  const lastSaveRef = useRef<{
    stepId: string;
    payload: Parameters<typeof saveBackendStep>[1];
    isEdit: boolean;
  } | null>(null);
  const prevBackendStepIdRef = useRef<string | undefined>(undefined);

  const sessionQuery = useGetV1OnboardingSession({ locale });
  const session = sessionQuery.data ?? fallbackSession ?? undefined;
  const flowStep: FlowStep | undefined = FLOW_PLAN[flowIndexOf(flowStepId)];
  const editStep = editStepId ? session?.steps.find((step) => step.id === editStepId) : undefined;
  // The backend step the current screen renders/persists to. In edit mode it's
  // the clicked step; otherwise it's derived from the flow cursor.
  const currentStep = editStep ?? backendStepForFlow(session, flowStep);
  // Fields visible on this screen: edit mode shows the whole backend step;
  // the linear flow shows only the slice this flow step owns.
  const flowFields = editStep ? visibleFields(editStep) : fieldsForFlowStep(currentStep, flowStep);
  const activeFieldKeys = editStep ? undefined : flowStep?.fieldKeys;
  // "Empty" = nothing to persist: a section with no items, or a form step with
  // no field filled. Optional steps gate "Continuar" on an explicit skip
  // acknowledgement while empty (sections + the links step alike).
  const stepIsEmpty = isSectionStep(currentStep)
    ? items.length === 0
    : isFormStepEmpty(flowFields, formData);

  const retryLoad = async () => {
    // Prefer server truth over any possibly-corrupt local snapshot.
    setFallbackSession(null);
    await clearSessionSnapshot();
    await clearResumeDismissed();
    resumeDismissedRef.current = false;
    resyncedStepRef.current = false;
    refreshedAuthRef.current = false;
    await sessionQuery.refetch();
  };

  const persistSession = async (nextSession: OnboardingSession) => {
    queryClient.setQueryData(sessionKey, nextSession);
    setFallbackSession(nextSession);
    await saveSessionSnapshot(nextSession);
  };

  const nextStep = usePostV1OnboardingSessionNext({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const gotoStep = usePostV1OnboardingSessionGoto({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const extras = usePostV1OnboardingSessionExtras({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const complete = usePostV1OnboardingSessionComplete({
    mutation: {
      async onSuccess() {
        await clearSessionSnapshot();
        await clearResumeDismissed();
        await bootstrap().catch(() => undefined);
        router.replace(getCompletedOnboardingRoute());
      },
      onError(error) {
        // Localize the backend rejection (e.g. INVALID_PROFESSIONAL_PROFILE)
        // via the contracts dictionary instead of surfacing the raw English
        // message; falls back to the backend message, then a generic key.
        const data = error.response?.data as { code?: unknown; message?: unknown } | undefined;
        setCompleteError(
          translateBackendCode(
            typeof data?.code === "string" ? data.code : undefined,
            locale,
            t("onboarding.completeFailed"),
            typeof data?.message === "string" ? data.message : undefined,
          ),
        );
      },
    },
  });

  const isPending =
    nextStep.isPending || gotoStep.isPending || extras.isPending || complete.isPending;

  useEffect(() => {
    void readSessionSnapshot().then((snapshot) => {
      if (!sessionQuery.data && snapshot) setFallbackSession(snapshot);
    });
  }, [sessionQuery.data]);

  useEffect(() => {
    // Token/session can expire mid-onboarding; try a silent refresh once.
    const status = getErrorStatus(sessionQuery.error);
    if (status !== 401 || refreshedAuthRef.current) return;
    refreshedAuthRef.current = true;
    void bootstrap()
      .catch(() => undefined)
      .then(() => sessionQuery.refetch())
      .catch(() => undefined);
  }, [sessionQuery.error, sessionQuery.refetch]);

  useEffect(() => {
    if (sessionQuery.data) void saveSessionSnapshot(sessionQuery.data);
  }, [sessionQuery.data]);

  useEffect(() => {
    // Initialise the app flow cursor from the persisted backend pointer once,
    // so a returning user resumes near where they left off. Start/terminal
    // backend steps (welcome, complete) have no flow step → default to
    // "language".
    if (!session || resyncedStepRef.current) return;
    resyncedStepRef.current = true;
    const resumed = flowStepForBackendStep(session, session.currentStep);
    if (!resumed) return;
    setFlowStepId(resumed.id);
    if (countedIndexOf(resumed.id) > 0 && !resumeDismissedRef.current) {
      // Returning mid-flow: offer a "continue where you left off" banner unless
      // it was already dismissed on a previous reload.
      const phase = phaseForFlowStep(resumed.id);
      setResumeBanner({ phaseLabel: phase ? t(phase.labelKey) : "" });
    }
  }, [session, t]);

  useEffect(() => {
    // Hydrate the sticky phone country: a prior choice wins, otherwise derive a
    // best-effort default from the device/UI locale (the user still confirms).
    void readPhoneCountry().then((iso) => {
      if (iso) setPhoneCountryIso(iso);
      else setPhoneCountryIso((prev) => prev ?? defaultCountryFromLocale(locale));
    });
  }, [locale]);

  useEffect(() => {
    // Load the once-per-device welcome flag so advanceFlow can skip the
    // interstitial after the language pick on subsequent runs.
    if (welcomeCheckedRef.current) return;
    welcomeCheckedRef.current = true;
    void readWelcomeSeen().then((seen) => {
      welcomeSeenRef.current = seen;
    });
    void readResumeDismissed().then((dismissed) => {
      resumeDismissedRef.current = dismissed;
    });
  }, []);

  useEffect(() => {
    // Re-hydrate form/items only when the BACKEND step changes. Sibling flow
    // steps that share a backend step (location↔personal, headline↔links)
    // keep accumulating into the same formData instead of being wiped.
    if (!session) return;
    const backendStepId = currentStep?.id;
    if (prevBackendStepIdRef.current === backendStepId) return;
    prevBackendStepIdRef.current = backendStepId;
    const saved = getSavedDataForStep(session, currentStep);
    setFormData(saved);
    setItems(getSavedItemsForStep(session, currentStep));
    setNoItemsAck(false);
    // Re-entering a step the user already tried (and failed) to submit keeps
    // its errors visible, so the "why" survives a Back/Next round-trip.
    setErrors(
      backendStepId && currentStep && attemptedSteps.has(backendStepId)
        ? validateStepFields(currentStep, saved)
        : {},
    );
    if (!backendStepId) return;
    void readStepDraft(backendStepId).then((draft) => {
      if (!draft || prevBackendStepIdRef.current !== backendStepId) return;
      if (Object.keys(draft.data).length > 0) setFormData((prev) => ({ ...prev, ...draft.data }));
      if (draft.items.length > 0) setItems(draft.items);
    });
  }, [currentStep, session, attemptedSteps]);

  useEffect(() => {
    // Pre-fill the headline from the current job once, until the user edits it.
    if (flowStepId !== "headline" || editStepId) return;
    const workStep = session?.steps.find((step) => step.sectionTypeKey === "work_experience_v1");
    const suggested = suggestHeadlineFromExperience(getSavedItemsForStep(session, workStep));
    if (!suggested) return;
    setFormData((prev) => (prev.headline?.trim() ? prev : { ...prev, headline: suggested }));
  }, [flowStepId, editStepId, session]);

  useEffect(() => {
    if (!currentStep) return;
    void saveStepDraft(currentStep.id, formData, items);
  }, [currentStep, formData, items]);

  // The backend routes posted data into buckets by its OWN stored pointer, and
  // `goto` repositions that pointer with no validation — so the app drives
  // ordering by positioning the pointer right before each save.
  async function saveBackendStep(
    stepId: string,
    payload: NonNullable<Parameters<typeof nextStep.mutateAsync>[0]["data"]>,
  ) {
    await gotoStep.mutateAsync({ data: { stepId }, params: { locale } });
    await nextStep.mutateAsync({ data: payload, params: { locale } });
    await clearStepDraft(stepId);
  }

  async function handleAddSection(extraId: string) {
    if (isPending) return;
    const nextExtras = Array.from(new Set([...(session?.activatedExtras ?? []), extraId]));
    await extras.mutateAsync({ data: { extras: nextExtras }, params: { locale } });
    await gotoStep.mutateAsync({ data: { stepId: extraId }, params: { locale } });
    setEditStepId(extraId);
  }

  // Save wrapper that keeps the data on failure and arms a retry instead of
  // throwing — a dropped connection mid-flow shouldn't lose what was typed.
  async function commitSave(
    stepId: string,
    payload: Parameters<typeof saveBackendStep>[1],
    isEdit: boolean,
  ): Promise<boolean> {
    setSaveError("");
    try {
      await saveBackendStep(stepId, payload);
      lastSaveRef.current = null;
      return true;
    } catch {
      lastSaveRef.current = { stepId, payload, isEdit };
      setSaveError(t("onboarding.saveFailed"));
      return false;
    }
  }

  function advanceFlow() {
    const nextFlow = nextFlowStep(flowStepId);
    if (!nextFlow) return;
    // Skip the welcome interstitial when it's already been seen on this device.
    if (nextFlow.id === "welcome" && welcomeSeenRef.current) {
      const afterWelcome = nextFlowStep("welcome");
      if (afterWelcome) setFlowStepId(afterWelcome.id);
      return;
    }
    setFlowStepId(nextFlow.id);
  }

  function markAttempted(stepId: string) {
    setAttemptedSteps((current) => {
      if (current.has(stepId)) return current;
      const next = new Set(current);
      next.add(stepId);
      return next;
    });
  }

  async function handleNext() {
    if (!flowStep || isPending) return;

    // Editing a section from the review hub: persist the whole backend step and
    // return to review (the cursor is already parked on the review step).
    if (editStep) {
      const editErrors = validateStepFields(editStep, formData);
      setErrors(editErrors);
      if (!canContinueStep(editStep, formData, items)) {
        markAttempted(editStep.id);
        return;
      }
      if (await commitSave(editStep.id, buildNextPayload(editStep, formData, items), true)) {
        setEditStepId(null);
      }
      return;
    }

    if (currentStep) {
      // Optional step acknowledged as empty ("I have none" / "skip this step")
      // → persist the skip payload and advance. Covers empty sections and the
      // optional links step, both gated on the same ack checkbox.
      if (flowStep.optional && stepIsEmpty && noItemsAck) {
        await handleSkip();
        return;
      }
      const nextErrors = validateStepFields(currentStep, formData, activeFieldKeys);
      setErrors(nextErrors);
      if (!canContinueStep(currentStep, formData, items, activeFieldKeys)) {
        markAttempted(currentStep.id);
        return;
      }
      // Sibling sub-steps (location, headline) defer the save to the last flow
      // step sharing their backend step, so the merged payload lands at once.
      if (isLastFlowStepForBackend(flowStep)) {
        const saved = await commitSave(
          currentStep.id,
          buildNextPayload(currentStep, formData, items),
          false,
        );
        if (!saved) return;
      }
    }
    advanceFlow();
  }

  async function handleSkip() {
    if (!flowStep || isPending) return;
    if (currentStep && isLastFlowStepForBackend(flowStep)) {
      // Sections mark themselves skipped; optional form steps just persist
      // whatever was accumulated (e.g. a headline typed before skipping links).
      const payload = isSectionStep(currentStep)
        ? buildSkipPayload()
        : buildNextPayload(currentStep, formData, items);
      if (!(await commitSave(currentStep.id, payload, false))) return;
    }
    advanceFlow();
  }

  // The save-failure banner re-runs the exact pending save, then resumes the
  // navigation the original action intended.
  async function retrySave() {
    const pending = lastSaveRef.current;
    if (!pending || isPending) return;
    if (!(await commitSave(pending.stepId, pending.payload, pending.isEdit))) return;
    if (pending.isEdit) setEditStepId(null);
    else advanceFlow();
  }

  function handleBack() {
    if (isPending) return;
    setSaveError("");
    if (editStep) {
      setEditStepId(null);
      return;
    }
    // Step over intro screens (welcome is forward-only) when going back.
    let prev = prevFlowStep(flowStepId);
    while (prev?.intro) prev = prevFlowStep(prev.id);
    if (prev) setFlowStepId(prev.id);
  }

  function handleGoto(stepId: string) {
    if (isPending) return;
    setEditStepId(stepId);
  }

  function dismissResumeBanner() {
    setResumeBanner(null);
    resumeDismissedRef.current = true;
    void markResumeDismissed();
  }

  /** First backend form step whose saved data fails the (Kubb-contract)
   *  per-step validation. Sections + resume-style are validated elsewhere. */
  function firstInvalidProfileStep(): string | null {
    if (!session) return null;
    for (const step of session.steps) {
      if (isSectionStep(step) || isResumeStyleStep(step)) continue;
      const stepErrors = validateStepFields(step, getSavedDataForStep(session, step));
      if (Object.keys(stepErrors).length > 0) return step.id;
    }
    return null;
  }

  function handleComplete() {
    setCompleteError("");
    if (session?.missingRequired?.length) {
      setCompleteError(t("onboarding.missingRequired"));
      return;
    }
    // Pre-complete gate: validate the assembled profile with the same
    // contract rules as the steps, and route to the first step with an invalid
    // field — its errors surface inline on entry (the step is marked attempted)
    // — instead of round-tripping to the backend for a generic
    // INVALID_PROFESSIONAL_PROFILE.
    const invalidStepId = firstInvalidProfileStep();
    if (invalidStepId) {
      markAttempted(invalidStepId);
      setEditStepId(invalidStepId);
      setCompleteError(t("onboarding.fixBeforeComplete"));
      return;
    }
    complete.mutate();
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
        onStart={() => {
          welcomeSeenRef.current = true;
          void markWelcomeSeen();
          advanceFlow();
        }}
      />
    );
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
                      onPhoneCountry={(iso) => {
                        setPhoneCountryIso(iso);
                        void savePhoneCountry(iso);
                      }}
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
// Chrome — masthead, progress, heading
// ────────────────────────────────────────────────────────────

function Masthead({
  phaseLabel,
  progressPct,
  timeText,
}: {
  phaseLabel: string;
  progressPct: number;
  timeText: string;
}): ReactElement {
  const pct = Math.max(0, Math.min(100, progressPct));
  return (
    <View style={ed.mastheadWrap}>
      {/* Brand isolated + centered, with breathing room above the progress. */}
      <View style={ed.mastheadBrand}>
        <PatchLogo />
      </View>
      {/* The progress bar leads as the section divider/rule. */}
      <View style={ed.track}>
        <View style={[ed.fill, { width: `${pct}%` }]} />
      </View>
      {/* Justified byline beneath the rule: section (left) ↔ time (right). */}
      <View style={ed.mastheadMeta}>
        {phaseLabel ? <RNText style={ed.phaseLabel}>{phaseLabel}</RNText> : <View />}
        <RNText style={ed.timeText}>{timeText}</RNText>
      </View>
    </View>
  );
}

function splitHeading(title: string): { head: string; tail: string } {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 1) return { head: "", tail: title };
  const tail = parts.pop() as string;
  return { head: `${parts.join(" ")} `, tail };
}

function StepHeading({ subtitle, title }: { subtitle?: string; title: string }): ReactElement {
  const { head, tail } = splitHeading(title);
  return (
    <View>
      <AnimatedField delay={80}>
        <RNText style={ed.heading}>
          {head ? <RNText style={ed.headingRegular}>{head}</RNText> : null}
          <RNText style={ed.headingItalic}>{tail}</RNText>
        </RNText>
      </AnimatedField>
      {subtitle ? (
        <AnimatedField delay={170}>
          <RNText style={ed.subtitle}>{subtitle}</RNText>
        </AnimatedField>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Small editorial building blocks
// ────────────────────────────────────────────────────────────

/** Acknowledgement checkbox — gates "Continuar" on an empty optional section
 *  ("Não tenho X"): the user must add an item or tick this to proceed. */
function AckCheckbox({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      hitSlop={8}
      style={ed.ackRow}
    >
      <View style={[ed.ackBox, checked ? ed.ackBoxChecked : null]}>
        {checked ? <Check size={12} color={authTokens.surface} strokeWidth={3} /> : null}
      </View>
      <RNText style={[ed.ghostLabel, disabled ? ed.dim : null]}>{label}</RNText>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────
// States
// ────────────────────────────────────────────────────────────

function CenteredState({
  actionLabel,
  label,
  onAction,
}: {
  actionLabel?: string;
  label: string;
  onAction?: () => void;
}): ReactElement {
  return (
    <SafeAreaView style={ed.centered}>
      <ActivityIndicator color={authTokens.ink} />
      <RNText style={ed.centeredText}>{label}</RNText>
      {actionLabel && onAction ? <GhostButton label={actionLabel} onPress={onAction} /> : null}
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

/** "Continue where you left off" banner on a resumed session. */
function ResumeBanner({
  onDismiss,
  phaseLabel,
  t,
}: {
  onDismiss: () => void;
  phaseLabel: string;
  t: Translator;
}): ReactElement {
  return (
    <View style={ed.resumeBanner}>
      <View style={ed.resumeBannerBody}>
        <RNText style={ed.resumeBannerTitle}>
          {t("onboarding.resume.title", { phase: phaseLabel })}
        </RNText>
        <RNText style={ed.resumeBannerSubtitle}>{t("onboarding.resume.subtitle")}</RNText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="dismiss"
        hitSlop={8}
        onPress={onDismiss}
      >
        <X size={18} color={authTokens.muted} />
      </Pressable>
    </View>
  );
}

/** Non-destructive save-failure banner with a retry (item: resilient retry). */
function RetryBanner({
  disabled,
  label,
  onRetry,
}: {
  disabled?: boolean;
  label: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onRetry}
      style={[ed.retryBanner, disabled ? ed.dim : null]}
    >
      <AlertCircle size={16} color={authTokens.danger} />
      <RNText style={ed.retryText}>{label}</RNText>
      <RefreshCw size={15} color={authTokens.danger} />
    </Pressable>
  );
}

/** Upfront list of required-but-incomplete steps on the review hub. */
function MissingBanner({
  onFix,
  targets,
  t,
}: {
  onFix: (stepId: string) => void;
  targets: readonly MissingRequiredTarget[];
  t: Translator;
}): ReactElement {
  return (
    <View style={ed.missingBanner}>
      <View style={ed.missingHead}>
        <AlertCircle size={15} color={authTokens.warn} />
        <RNText style={ed.missingTitle}>{t("onboarding.review.missingTitle")}</RNText>
      </View>
      {targets.map((target) => (
        <Pressable
          key={target.stepId}
          accessibilityRole="button"
          onPress={() => onFix(target.stepId)}
          style={ed.missingRow}
        >
          <RNText style={ed.missingLabel} numberOfLines={1}>
            {target.label}
          </RNText>
          <RNText style={ed.missingFix}>{t("onboarding.review.fix")}</RNText>
        </Pressable>
      ))}
    </View>
  );
}
