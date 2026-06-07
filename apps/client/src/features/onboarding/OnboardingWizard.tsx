import {
  getV1OnboardingSessionQueryKey,
  getV1UsersUsernameCheck,
  useGetV1OnboardingSession,
  useGetV1ResumeStylesIdPreviewPdf,
  usePostV1OnboardingSessionComplete,
  usePostV1OnboardingSessionExtras,
  usePostV1OnboardingSessionGoto,
  usePostV1OnboardingSessionNext,
} from "@patch-careers/api-client";
import { bootstrap } from "@patch-careers/auth";
import { formatDate, type Locale, type Translator } from "@patch-careers/i18n";
import { editorialPalette as authTokens } from "@patch-careers/tokens";
import { PhoneInput } from "@patch-careers/ui";
import {
  AnimatedField,
  FieldError,
  editorialFonts as fonts,
  PatchLogo,
  PrimaryAction,
  UnderlineInput,
} from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react-native";
import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text as RNText,
  SafeAreaView,
  ScrollView,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextStyle,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { translateBackendCode } from "../../components/auth/validation";
import { getCompletedOnboardingRoute } from "../../navigation/authRedirect";
import { useI18n } from "../../providers/I18nProvider";
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
  isLastFlowStepForBackend,
  isResumeStyleStep,
  isSectionStep,
  itemSummary,
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
      // Optional section acknowledged as empty ("I have none") → persist the
      // skip payload and advance, same as the explicit skip.
      if (isSectionStep(currentStep) && items.length === 0 && noItemsAck) {
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
    // Optional sections need ≥1 item OR an explicit "I have none" acknowledgement.
    if (isSectionStep(currentStep)) return items.length > 0 || noItemsAck;
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
                    <MultiItemStep
                      step={currentStep}
                      items={items}
                      onChange={setItems}
                      isPending={isPending}
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

                {showSkip && isSectionStep(currentStep) ? (
                  items.length === 0 ? (
                    <View style={ed.skipRow}>
                      <AckCheckbox
                        label={currentStep?.noDataLabel ?? t("onboarding.skip")}
                        checked={noItemsAck}
                        onToggle={() => setNoItemsAck((value) => !value)}
                        disabled={isPending}
                      />
                    </View>
                  ) : null
                ) : showSkip ? (
                  <View style={ed.skipRow}>
                    <GhostButton
                      label={currentStep?.noDataLabel ?? t("onboarding.skip")}
                      onPress={() => void handleSkip()}
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

function GhostButton({
  danger,
  disabled,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={ed.ghost}
    >
      <RNText style={[ed.ghostLabel, danger ? ed.ghostDanger : null, disabled ? ed.dim : null]}>
        {label}
      </RNText>
    </Pressable>
  );
}

function FieldLabel({ children, error }: { children: ReactNode; error?: boolean }): ReactElement {
  return <RNText style={[ed.fieldLabel, error ? ed.fieldLabelError : null]}>{children}</RNText>;
}

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

/**
 * "Plus (or spinner) + label" affordance — the add row the multi-item list,
 * the section empty state and the review hub each hand-rolled.
 */
function AddRow({
  label,
  onPress,
  style,
  labelStyle,
  loading = false,
  disabled = false,
  iconSize = 15,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
  iconSize?: number;
}): ReactElement {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={style}>
      {loading ? (
        <ActivityIndicator size="small" color={authTokens.ink} />
      ) : (
        <Plus size={iconSize} color={authTokens.ink} strokeWidth={2} />
      )}
      <RNText style={labelStyle ?? ed.addLabel}>{label}</RNText>
    </Pressable>
  );
}

/**
 * Full-screen RN `<Modal>` with the shared transparent / fade / scrim prop
 * set the onboarding modals each repeated; callers supply the scrim + card.
 */
function OverlayModal({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  );
}

/**
 * Label + control + hairline underline + error — the shape the textarea
 * and date fields each hand-rolled, mirroring the editorial UnderlineInput.
 */
function FieldShell({
  label,
  error,
  focused = false,
  children,
}: {
  label: string;
  error?: string | undefined;
  focused?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <View>
      <FieldLabel error={Boolean(error)}>{label}</FieldLabel>
      {children}
      <View
        style={[
          ed.fieldLine,
          focused ? ed.fieldLineFocused : null,
          error ? ed.fieldLineError : null,
        ]}
      />
      {error ? <FieldError text={error} /> : null}
    </View>
  );
}

function OptionPill({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[ed.pill, selected ? ed.pillSelected : null]}
    >
      <RNText style={[ed.pillLabel, selected ? ed.pillLabelSelected : null]}>{label}</RNText>
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
// Date field — a dependency-free month/year picker. Job & education dates are
// month-granular (the API stores day 01, e.g. "2022-06-01"), so a native picker
// would be overkill and would pull in a native module + dev-client rebuild.
// ────────────────────────────────────────────────────────────

function parseYearMonth(value: string): { month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { month, year };
}

// Build the date from local components so a date-only string can't shift a
// month across the UTC boundary when Intl formats it.
function monthLabel(
  year: number,
  month: number,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions,
): string {
  return formatDate(new Date(year, month - 1, 1), locale, opts);
}

function DateField({
  allowEmpty,
  error,
  label,
  onChange,
  value,
}: {
  allowEmpty: boolean;
  error?: string | undefined;
  label: string;
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const parsed = parseYearMonth(value);
  const display = parsed
    ? monthLabel(parsed.year, parsed.month, locale, { month: "short", year: "numeric" })
    : allowEmpty
      ? t("onboarding.date.present")
      : t("onboarding.date.placeholder");
  return (
    <>
      <FieldShell label={label} error={error}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display}`}
          onPress={() => setOpen(true)}
          style={ed.dateField}
        >
          <RNText style={[ed.dateValue, parsed ? null : ed.datePlaceholder]}>{display}</RNText>
          <Calendar size={18} color={authTokens.subtle} />
        </Pressable>
      </FieldShell>
      <MonthYearPicker
        visible={open}
        value={value}
        title={label}
        allowEmpty={allowEmpty}
        onClose={() => setOpen(false)}
        onChange={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}

function MonthYearPicker({
  allowEmpty,
  onChange,
  onClose,
  title,
  value,
  visible,
}: {
  allowEmpty: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  title: string;
  value: string;
  visible: boolean;
}): ReactElement {
  const { locale, t } = useI18n();
  const selected = parseYearMonth(value);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(selected?.year ?? thisYear);
  // Re-seed the visible year each time the sheet opens.
  useEffect(() => {
    if (visible) setYear(parseYearMonth(value)?.year ?? thisYear);
  }, [visible, value, thisYear]);
  const months = Array.from({ length: 12 }, (_, i) =>
    monthLabel(2020, i + 1, locale, { month: "short" }),
  );
  return (
    <OverlayModal visible={visible} onRequestClose={onClose}>
      <Pressable style={ed.pickerOverlay} onPress={onClose}>
        {/* Absorb taps inside the card so they don't dismiss it. */}
        <Pressable style={ed.pickerCard} onPress={() => undefined}>
          <RNText style={ed.pickerTitle}>{title}</RNText>
          <View style={ed.pickerYearRow}>
            <Pressable
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.date.prevYear")}
              onPress={() => setYear((y) => Math.max(1950, y - 1))}
            >
              <ChevronLeft size={22} color={authTokens.ink} />
            </Pressable>
            <RNText style={ed.pickerYear}>{year}</RNText>
            <Pressable
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.date.nextYear")}
              onPress={() => setYear((y) => Math.min(thisYear + 1, y + 1))}
            >
              <ChevronRight size={22} color={authTokens.ink} />
            </Pressable>
          </View>
          <View style={ed.pickerGrid}>
            {months.map((monthName, i) => {
              const month = i + 1;
              const isSel = selected?.month === month && selected?.year === year;
              return (
                <Pressable
                  key={monthName}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                  onPress={() => onChange(`${year}-${String(month).padStart(2, "0")}-01`)}
                  style={[ed.pickerMonth, isSel ? ed.pickerMonthSelected : null]}
                >
                  <RNText style={[ed.pickerMonthText, isSel ? ed.pickerMonthTextSelected : null]}>
                    {monthName}
                  </RNText>
                </Pressable>
              );
            })}
          </View>
          {allowEmpty ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange("")}
              style={ed.pickerClear}
            >
              <RNText style={ed.pickerClearText}>{t("onboarding.date.present")}</RNText>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </OverlayModal>
  );
}

/** Per-state visuals for the username availability chip (dot + text + label). */
const USERNAME_STATE_META: Record<
  "checking" | "available" | "unavailable" | "error",
  { dot: string; color: string; labelKey: string }
> = {
  checking: {
    dot: authTokens.subtle,
    color: authTokens.muted,
    labelKey: "onboarding.username.checking",
  },
  available: {
    dot: authTokens.success,
    color: authTokens.success,
    labelKey: "onboarding.username.available",
  },
  unavailable: {
    dot: authTokens.danger,
    color: authTokens.danger,
    labelKey: "onboarding.username.taken",
  },
  error: { dot: authTokens.warn, color: authTokens.warn, labelKey: "onboarding.username.error" },
};

function FieldRenderer({
  error,
  field,
  onChange,
  value,
}: {
  error?: string;
  field: OnboardingField;
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "unavailable" | "error"
  >("idle");
  const examples = field.examples ?? [];
  const placeholder = examples[0] ?? "";
  const multiline = field.type === "textarea" || field.widget === "textarea";
  const hasOptions = field.type === "select" || Boolean(field.options?.length);
  const isUsername = field.key === "username";
  // The backend still ships start/end dates as plain text; treat anything that
  // looks like a date (type/widget "date", or a `*Date` key) as a month picker.
  const isDate = field.type === "date" || field.widget === "date" || /[a-z]Date$/.test(field.key);

  // Surface the failure (item: username checker fallback) so the user can retry
  // instead of the chip silently disappearing. Stable so it can be reused by the
  // debounced effect and the manual retry.
  const checkUsername = useCallback((username: string) => {
    void getV1UsersUsernameCheck({ username })
      .then((result) => setUsernameState(result.available ? "available" : "unavailable"))
      .catch(() => setUsernameState("error"));
  }, []);

  useEffect(() => {
    if (!isUsername) return;
    const username = value.trim();
    if (username.length < 3) {
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = setTimeout(() => checkUsername(username), 450);
    return () => clearTimeout(timer);
  }, [isUsername, value, checkUsername]);

  const retryUsername = () => {
    const username = value.trim();
    if (username.length < 3) return;
    setUsernameState("checking");
    checkUsername(username);
  };

  if (isDate) {
    return (
      <DateField
        label={field.label}
        value={value}
        onChange={onChange}
        error={error}
        // An empty end date means "present"; start dates are required.
        allowEmpty={field.key === "endDate" || !field.required}
      />
    );
  }

  if (hasOptions) {
    return (
      <View>
        <FieldLabel error={Boolean(error)}>{field.label}</FieldLabel>
        <View style={ed.pillWrap}>
          {(field.options ?? []).map((option) => (
            <OptionPill
              key={option}
              label={option}
              selected={option === value}
              onPress={() => onChange(option)}
            />
          ))}
        </View>
        {error ? <FieldError text={error} /> : null}
      </View>
    );
  }

  if (multiline) {
    return (
      <FieldShell label={field.label} error={error} focused={focused}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={authTokens.subtle}
          multiline
          style={ed.textarea}
        />
      </FieldShell>
    );
  }

  return (
    <View>
      <UnderlineInput
        label={field.label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        hasError={Boolean(error)}
        keyboardType={
          field.type === "email" ? "email-address" : field.type === "url" ? "url" : "default"
        }
        autoCapitalize={
          isUsername || field.type === "email" || field.type === "url" ? "none" : "sentences"
        }
        autoCorrect={field.type !== "url" && field.type !== "email" && !isUsername}
        {...(isUsername
          ? { autoComplete: "username" as const, textContentType: "username" as const }
          : {})}
      />
      {isUsername && usernameState !== "idle" ? (
        <Pressable
          style={ed.chip}
          disabled={usernameState !== "error"}
          onPress={retryUsername}
          accessibilityRole={usernameState === "error" ? "button" : "text"}
        >
          <View style={[ed.chipDot, { backgroundColor: USERNAME_STATE_META[usernameState].dot }]} />
          <RNText style={[ed.chipText, { color: USERNAME_STATE_META[usernameState].color }]}>
            {t(USERNAME_STATE_META[usernameState].labelKey)}
          </RNText>
        </Pressable>
      ) : null}
      {error ? <FieldError text={error} /> : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Multi-item editor (inline)
// ────────────────────────────────────────────────────────────

/**
 * Multi-item editor (work experience, education, …). The editor is INLINE — a
 * card that replaces the list — rather than a modal, which on web rendered
 * blank inside the scroll container and offered no cancel/delete. Items live in
 * local state and only reach the backend when the section step is submitted.
 *
 * When the section is empty it opens straight into the new-item editor (fields
 * ready to fill); saving the first item reveals the list with an "add another"
 * affordance.
 */
function MultiItemStep({
  isPending,
  items,
  onChange,
  step,
  t,
}: {
  isPending: boolean;
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
  step: OnboardingStep;
  t: (key: string) => string;
}): ReactElement {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<FormData>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const fields = visibleFields(step);
  // Safety net: if the backend session didn't return this section's item fields
  // (e.g. the section-type definitions aren't seeded), don't drop the user into
  // a blank editor — show a notice and let them skip.
  const hasNoFields = fields.length === 0;
  const isEmpty = items.length === 0;
  const isEditing = editingIndex !== null;
  const showEditor = isEditing;
  const activeIndex = editingIndex ?? items.length;
  const isNew = activeIndex === items.length;
  const hasErrors = Object.keys(validateStepFields(step, draft)).length > 0;

  function openNew() {
    setDraft({});
    setDraftErrors({});
    setEditingIndex(items.length);
  }

  function openExisting(index: number) {
    const content = items[index]?.content ?? {};
    setDraft(
      Object.fromEntries(Object.entries(content).map(([key, value]) => [key, String(value ?? "")])),
    );
    setDraftErrors({});
    setEditingIndex(index);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setDraft({});
    setDraftErrors({});
  }

  function saveItem() {
    const nextErrors = validateStepFields(step, draft);
    setDraftErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const next = items.slice();
    // Preserve the backend id when editing so the section isn't re-created.
    const existing = items[activeIndex];
    next[activeIndex] = { ...(existing?.id ? { id: existing.id } : {}), content: { ...draft } };
    onChange(next);
    setEditingIndex(null);
    setDraft({});
    setDraftErrors({});
  }

  function removeAt(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function deleteEditing() {
    if (!isEditing || isNew) return;
    removeAt(activeIndex);
    setEditingIndex(null);
    setDraft({});
  }

  if (hasNoFields) {
    return (
      <View style={ed.noticeCard}>
        <AlertCircle size={18} color={authTokens.warn} />
        <RNText style={ed.noticeTitle}>{t("onboarding.section.noFieldsTitle")}</RNText>
        <RNText style={ed.noticeBody}>{t("onboarding.section.noFieldsBody")}</RNText>
      </View>
    );
  }

  const addLabel = step.addLabel ?? t("onboarding.addItem");

  // The list / empty-state stays mounted; the item editor opens as a full-screen
  // modal over it (slides up), rather than replacing the content inline.
  const underlying = isEmpty ? (
    <SectionEmptyState
      sectionTypeKey={step.sectionTypeKey}
      addLabel={addLabel}
      onAdd={openNew}
      t={t}
    />
  ) : (
    <View>
      <View>
        {items.map((item, index) => (
          <Pressable
            key={item.id ?? `${index}-${itemSummary(item)}`}
            onPress={() => openExisting(index)}
            style={ed.itemRow}
          >
            <RNText style={ed.itemText} numberOfLines={1}>
              {itemSummary(item)}
            </RNText>
            <Pressable accessibilityRole="button" onPress={() => removeAt(index)} hitSlop={8}>
              <Trash2 size={16} color={authTokens.danger} />
            </Pressable>
          </Pressable>
        ))}
      </View>

      <AddRow label={addLabel} onPress={openNew} style={ed.addRow} />
    </View>
  );

  return (
    <View>
      {underlying}
      <MultiItemEditorModal
        visible={showEditor}
        title={isNew ? addLabel : t("onboarding.editItem")}
        fields={fields}
        draft={draft}
        draftErrors={draftErrors}
        onChangeDraft={setDraft}
        onSave={saveItem}
        onCancel={cancelEdit}
        {...(isEditing && !isNew ? { onDelete: deleteEditing } : {})}
        saveDisabled={hasErrors || isPending}
        disabled={isPending}
        t={t}
      />
    </View>
  );
}

/** Full-screen item editor for section steps (work experience, education, …).
 *  Slides up over the list; opaque so it reads as a dedicated screen. */
function MultiItemEditorModal({
  disabled,
  draft,
  draftErrors,
  fields,
  onCancel,
  onChangeDraft,
  onDelete,
  onSave,
  saveDisabled,
  t,
  title,
  visible,
}: {
  disabled: boolean;
  draft: FormData;
  draftErrors: Record<string, string>;
  fields: OnboardingField[];
  onCancel: () => void;
  onChangeDraft: (data: FormData) => void;
  onDelete?: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  t: (key: string) => string;
  title: string;
  visible: boolean;
}): ReactElement {
  // Centered card (80% × 80%) over a scrim instead of a full-bleed slide-up:
  // a RN <Modal> renders in its own native root where safe-area insets don't
  // apply, so a full-screen header collided with the status bar. Centering the
  // card clears the top inset by construction and reads as a focused dialog.
  return (
    <OverlayModal visible={visible} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={ed.editorModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tap outside the card to dismiss */}
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          onPress={onCancel}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <RNText style={ed.editorModalTitle}>{title}</RNText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
              hitSlop={12}
              onPress={onCancel}
            >
              <X size={22} color={authTokens.muted} />
            </Pressable>
          </View>
          <ScrollView
            style={ed.flex}
            contentContainerStyle={ed.editorModalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <StepForm fields={fields} data={draft} errors={draftErrors} onChange={onChangeDraft} />
          </ScrollView>
          <View style={ed.editorModalFooter}>
            {onDelete ? (
              <GhostButton
                danger
                label={t("common.delete")}
                onPress={onDelete}
                disabled={disabled}
              />
            ) : (
              <View />
            )}
            <PrimaryAction label={t("common.save")} onPress={onSave} disabled={saveDisabled} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </OverlayModal>
  );
}

/** Illustrated empty state for a section step (item: SVG empty states). */
function SectionEmptyState({
  addLabel,
  onAdd,
  sectionTypeKey,
  t,
}: {
  addLabel: string;
  onAdd: () => void;
  sectionTypeKey: string | undefined;
  t: (key: string) => string;
}): ReactElement {
  const Art = sectionArtFor(sectionTypeKey);
  return (
    <AnimatedField delay={120}>
      <View style={ed.emptyState}>
        <Art size={120} />
        <RNText style={ed.emptyTitle}>{t("onboarding.section.emptyTitle")}</RNText>
        <RNText style={ed.emptyBody}>{t("onboarding.section.emptyBody")}</RNText>
        <AddRow label={addLabel} onPress={onAdd} style={ed.emptyAdd} />
      </View>
    </AnimatedField>
  );
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

/** Web-only: the style's generic preview PDF (`GET …/preview.pdf`, JWT-gated)
 *  fetched as a blob and rendered inline through the browser's native PDF
 *  viewer via an object URL — no presigned-URL hop, no extra deps. Mirrors the
 *  Resume tab's `srcDoc` iframe split. The hook only mounts while the modal is
 *  open (parent guards on `option`), so the PDF render isn't kicked off until
 *  the user actually opens a preview. */
function StylePreviewWeb({ option }: { option: ResumeStyleOption }): ReactElement {
  const pdf = useGetV1ResumeStylesIdPreviewPdf(option.id, {
    client: { responseType: "blob" },
    query: { refetchOnWindowFocus: false, staleTime: 5 * 60_000 },
  });
  const blob = pdf.data;
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    // The endpoint streams the PDF as application/octet-stream; re-tag the
    // blob as application/pdf so the <iframe> renders it inline instead of
    // offering a download.
    const pdf =
      blob.type === "application/pdf" ? blob : blob.slice(0, blob.size, "application/pdf");
    const objectUrl = URL.createObjectURL(pdf);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (pdf.isLoading) {
    return (
      <View style={[ed.modalPreview, ed.modalPreviewEmpty, ed.modalPreviewCenter]}>
        <ActivityIndicator color={authTokens.ink} />
      </View>
    );
  }
  if (pdf.isError || !url) {
    return (
      <View style={[ed.modalPreview, ed.modalPreviewEmpty, ed.modalPreviewCenter]}>
        <RNText style={ed.modalPreviewHint}>Pré-visualização indisponível.</RNText>
      </View>
    );
  }
  return (
    <View style={ed.modalPreview}>
      <iframe
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
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
    </View>
  );
}

/** Preview visual: live PDF render on web; thumbnail (or placeholder) native. */
function StylePreview({ option }: { option: ResumeStyleOption }): ReactElement {
  if (Platform.OS === "web") return <StylePreviewWeb option={option} />;
  return option.thumbnailUrl ? (
    <Image source={{ uri: option.thumbnailUrl }} style={ed.modalPreview} resizeMode="contain" />
  ) : (
    <View style={[ed.modalPreview, ed.modalPreviewEmpty]} />
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
                {section.stylePreviewUrl ? (
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

// ────────────────────────────────────────────────────────────
// Styles — "Editorial Calm" (shared with the auth screens)
// ────────────────────────────────────────────────────────────

/** Shared "small-caps eyebrow" recipe; entries add fontSize/letterSpacing/color. */
const eyebrow = {
  fontFamily: fonts.sans,
  fontWeight: "600",
  textTransform: "uppercase",
} as const;

const ed = StyleSheet.create({
  root: { flex: 1, backgroundColor: authTokens.bg },
  flex: { flex: 1 },
  // Page fills the viewport and centers the cluster vertically. Because the body
  // is a fixed height (set inline from the viewport), the cluster's total height
  // is constant — the masthead and footer land at the same Y on every step.
  page: { flex: 1, justifyContent: "center", paddingTop: 24, paddingBottom: 28 },
  column: { width: "100%", maxWidth: 460, alignSelf: "center" },
  // Body content sits at the TOP of the fixed box (right under the subtitle), so
  // short steps read top-anchored while the box itself stays centered in the
  // viewport. flexGrow keeps the scroll area full-height; taller steps scroll.
  bodyScroll: { flexGrow: 1, justifyContent: "flex-start" },

  // masthead + progress
  mastheadWrap: { marginBottom: 36 },
  mastheadBrand: {
    alignItems: "center",
    marginBottom: 26,
  },
  mastheadMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 14,
  },
  phaseLabel: {
    ...eyebrow,
    fontSize: 10,
    letterSpacing: 1.8,
    color: authTokens.ink,
  },
  timeText: {
    fontFamily: fonts.mono,
    fontSize: 15.6,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: authTokens.ink,
  },
  track: {
    height: 2,
    width: "100%",
    backgroundColor: authTokens.hairline,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: authTokens.ink, borderRadius: 2 },

  // heading
  heading: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    color: authTokens.ink,
    letterSpacing: -0.6,
    fontWeight: "400",
  },
  headingRegular: { fontStyle: "normal" },
  headingItalic: { fontStyle: "italic" },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: authTokens.body,
    marginTop: 12,
    // Full column width (was capped at 380) so blocks share one width rhythm.
  },
  body: { marginTop: 34 },

  // footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 36,
  },
  footerError: { alignItems: "flex-end", marginTop: 10 },
  skipRow: { alignItems: "center", marginTop: 22 },
  ackRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  ackBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: authTokens.hairlineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  ackBoxChecked: { backgroundColor: authTokens.ink, borderColor: authTokens.ink },
  ghost: { paddingVertical: 10, paddingHorizontal: 2 },
  ghostLabel: {
    ...eyebrow,
    fontSize: 12,
    letterSpacing: 1.6,
    color: authTokens.muted,
  },
  ghostDanger: { color: authTokens.danger },
  dim: { opacity: 0.4 },

  // fields
  fieldStack: { gap: 26 },
  fieldLabel: {
    ...eyebrow,
    fontSize: 10,
    letterSpacing: 1.8,
    color: authTokens.muted,
    marginBottom: 10,
  },
  fieldLabelError: { color: authTokens.danger },
  textarea: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 24,
    color: authTokens.ink,
    paddingVertical: 8,
    minHeight: 92,
    textAlignVertical: "top",
  },
  fieldLine: { height: 1, width: "100%", backgroundColor: authTokens.hairlineStrong },
  fieldLineFocused: { height: 1.5, backgroundColor: authTokens.accent },
  fieldLineError: { height: 1.5, backgroundColor: authTokens.danger },

  // option pills
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: authTokens.surface,
  },
  pillSelected: { borderColor: authTokens.ink, backgroundColor: authTokens.ink },
  pillLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 0.2,
    fontWeight: "500",
    color: authTokens.body,
  },
  pillLabelSelected: { color: authTokens.surface },

  // username chip
  chip: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  // date field (trigger mimics the underline input)
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
    paddingVertical: 8,
  },
  dateValue: { fontFamily: fonts.sans, fontSize: 18, color: authTokens.ink },
  datePlaceholder: { color: authTokens.subtle },

  // month/year picker
  pickerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(10,10,10,0.45)",
  },
  pickerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: authTokens.bg,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  pickerTitle: { fontFamily: fonts.serif, fontSize: 20, color: authTokens.ink },
  pickerYearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  pickerYear: {
    fontFamily: fonts.mono,
    fontSize: 18,
    letterSpacing: 1,
    color: authTokens.ink,
    minWidth: 64,
    textAlign: "center",
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  pickerMonth: {
    width: "31%",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTokens.hairline,
    backgroundColor: authTokens.surface,
  },
  pickerMonthSelected: { backgroundColor: authTokens.ink, borderColor: authTokens.ink },
  pickerMonthText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: authTokens.body,
    textTransform: "capitalize",
  },
  pickerMonthTextSelected: { color: authTokens.surface },
  pickerClear: { alignItems: "center", paddingVertical: 6 },
  pickerClearText: {
    ...eyebrow,
    fontSize: 12,
    letterSpacing: 1.4,
    color: authTokens.muted,
  },

  // language
  langWrap: { gap: 10 },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: authTokens.surface,
  },
  langCardSelected: { borderColor: authTokens.ink },
  langText: { flex: 1, gap: 3 },
  langLabel: { fontFamily: fonts.serif, fontSize: 19, color: authTokens.ink },
  langHint: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: authTokens.muted },

  // step context — fills out short steps (link preview + reassurance notes)
  context: { marginTop: 28 },
  contextRule: {
    height: 1,
    width: 28,
    backgroundColor: authTokens.hairlineStrong,
    marginBottom: 12,
  },
  contextLabel: {
    ...eyebrow,
    fontSize: 10,
    letterSpacing: 1.8,
    color: authTokens.muted,
    marginBottom: 8,
  },
  contextBody: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: authTokens.body },
  linkCard: {
    borderWidth: 1,
    borderColor: authTokens.hairline,
    borderRadius: 14,
    backgroundColor: authTokens.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  linkCardLabel: {
    ...eyebrow,
    fontSize: 10,
    letterSpacing: 1.8,
    color: authTokens.muted,
  },
  linkUrl: { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 0.2, color: authTokens.subtle },
  linkHandle: { color: authTokens.ink },
  linkNote: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: authTokens.muted },

  // multi-item
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: authTokens.hairline,
    paddingVertical: 16,
  },
  itemText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: authTokens.ink },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 16, marginTop: 4 },
  addLabel: {
    ...eyebrow,
    fontSize: 12,
    letterSpacing: 1.4,
    color: authTokens.ink,
  },
  // full-screen item editor modal
  editorModalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.45)",
  },
  editorModalBackdrop: { ...StyleSheet.absoluteFillObject },
  editorModalCard: {
    width: "90%",
    height: "90%",
    maxWidth: 560,
    backgroundColor: authTokens.bg,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  editorModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: authTokens.hairline,
  },
  editorModalTitle: { fontFamily: fonts.serif, fontSize: 22, color: authTokens.ink },
  editorModalScroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  editorModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: authTokens.hairline,
  },

  // resume style
  styleStack: { gap: 12 },
  styleCard: {
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 18,
    backgroundColor: authTokens.surface,
    padding: 14,
  },
  styleCardSelected: { borderColor: authTokens.ink },
  styleImage: { width: 60, height: 80, borderRadius: 10, backgroundColor: authTokens.hairline },
  styleBody: { flex: 1, gap: 4, justifyContent: "center" },
  styleNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  styleName: { fontFamily: fonts.serif, fontSize: 18, color: authTokens.ink },
  styleDesc: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: authTokens.muted },
  styleAts: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.5, color: authTokens.success },

  // review
  reviewCard: {
    borderWidth: 1,
    borderColor: authTokens.hairline,
    borderRadius: 18,
    backgroundColor: authTokens.surface,
    padding: 18,
    marginBottom: 12,
  },
  reviewHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  reviewLabel: {
    ...eyebrow,
    fontSize: 10,
    letterSpacing: 1.6,
    color: authTokens.muted,
  },
  reviewSkipped: { fontFamily: fonts.sans, fontSize: 14, color: authTokens.subtle },
  reviewStyleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewStyleName: { fontFamily: fonts.serif, fontSize: 17, color: authTokens.ink },
  reviewImage: { width: 48, height: 64, borderRadius: 8, backgroundColor: authTokens.hairline },
  reviewEntry: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 7 },
  reviewEntryLabel: { fontFamily: fonts.sans, fontSize: 12, color: authTokens.muted, flex: 1 },
  reviewEntryValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: authTokens.ink,
    flex: 2,
    textAlign: "right",
  },
  reviewEntryLong: { textAlign: "left" },
  addSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  addSectionLabel: {
    ...eyebrow,
    fontSize: 12,
    letterSpacing: 1.2,
    color: authTokens.ink,
  },

  // states
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 28,
    backgroundColor: authTokens.bg,
  },
  centeredText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: authTokens.body,
    textAlign: "center",
  },

  // welcome
  welcomeWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 28,
  },
  welcomeArt: { marginVertical: 8 },
  welcomeHeading: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    color: authTokens.ink,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  welcomeTagline: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: authTokens.body,
    textAlign: "center",
    maxWidth: 340,
  },
  welcomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: authTokens.surface,
  },
  welcomeBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.4,
    fontWeight: "600",
    color: authTokens.ink,
  },
  welcomeCta: { width: "100%", marginTop: 8, alignItems: "stretch" },

  // resume banner
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 14,
    backgroundColor: authTokens.surface,
    padding: 14,
    marginBottom: 20,
  },
  resumeBannerBody: { flex: 1, gap: 2 },
  resumeBannerTitle: { fontFamily: fonts.serif, fontSize: 16, color: authTokens.ink },
  resumeBannerSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: authTokens.muted },

  // retry banner
  retryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: authTokens.danger,
    borderRadius: 12,
    backgroundColor: authTokens.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  retryText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: authTokens.danger },

  // missing-required banner
  missingBanner: {
    borderWidth: 1,
    borderColor: authTokens.warn,
    borderRadius: 14,
    backgroundColor: authTokens.surface,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  missingHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  missingTitle: {
    ...eyebrow,
    fontSize: 10,
    letterSpacing: 1.6,
    color: authTokens.warn,
  },
  missingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: authTokens.hairline,
  },
  missingLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: authTokens.ink },
  missingFix: {
    ...eyebrow,
    fontSize: 11,
    letterSpacing: 1.2,
    color: authTokens.accent,
  },

  // section empty state
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: authTokens.ink, marginTop: 4 },
  emptyBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: authTokens.muted,
    textAlign: "center",
    maxWidth: 300,
  },
  emptyAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 6,
  },

  // section "no fields" safety-net notice
  noticeCard: {
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 16,
    backgroundColor: authTokens.surface,
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  noticeTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: authTokens.ink,
    textAlign: "center",
  },
  noticeBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: authTokens.muted,
    textAlign: "center",
    maxWidth: 300,
  },

  // resume-style preview hint + modal
  stylePreviewHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 0.4,
    color: authTokens.subtle,
    marginTop: 2,
  },
  modalScroll: { gap: 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: authTokens.hairline,
  },
  modalPreview: {
    width: "100%",
    aspectRatio: 1 / Math.SQRT2, // A4 portrait (√2 ratio) — height scales with card width
    borderRadius: 14,
    backgroundColor: authTokens.surface,
    overflow: "hidden",
  },
  modalPreviewEmpty: { borderWidth: 1, borderColor: authTokens.hairline },
  modalPreviewCenter: { alignItems: "center", justifyContent: "center" },
  modalPreviewHint: { fontFamily: fonts.sans, fontSize: 13, color: authTokens.muted },
  modalDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: authTokens.body,
    alignSelf: "stretch",
  },
  atsSeal: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 14,
    backgroundColor: authTokens.surface,
    padding: 14,
    gap: 4,
  },
  atsSealLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.4,
    color: authTokens.ink,
  },
  atsSealBlurb: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: authTokens.muted },
});
