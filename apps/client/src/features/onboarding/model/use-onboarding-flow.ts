/**
 * Onboarding flow orchestration (ADR-0002/0004) — the wizard's state machine,
 * extracted from the render so onboarding-wizard.tsx is just chrome + steps.
 *
 * Owns: the backend session (query + optimistic snapshot), the app-side flow
 * cursor, the per-step draft (via the scoped wizard store), validation gating,
 * resume/welcome flags, and the save/navigate handlers. Returns a view-model
 * the wizard renders; it holds no JSX itself.
 */
import {
  getV1OnboardingSessionQueryKey,
  useGetV1OnboardingSession,
  usePostV1OnboardingSessionComplete,
  usePostV1OnboardingSessionExtras,
  usePostV1OnboardingSessionGoto,
  usePostV1OnboardingSessionNext,
} from "@patch-careers/api-client";
import { bootstrap } from "@patch-careers/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { translateBackendCode } from "@/components/auth/validation";
import { getCompletedOnboardingRoute } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";
import {
  countedIndexOf,
  FLOW_PLAN,
  type FlowStep,
  type FlowStepId,
  flowIndexOf,
  nextFlowStep,
  phaseForFlowStep,
  prevFlowStep,
} from "../lib/flow-plan";
import {
  backendStepForFlow,
  buildNextPayload,
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
  validateStepFields,
  visibleFields,
} from "../lib/helpers";
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
} from "../lib/storage";
import { suggestHeadlineFromExperience } from "../lib/suggestions";
import type { OnboardingSession } from "../types";
import { useWizardStore } from "./wizard-store-context";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== "object") return undefined;
  const status = (response as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function useOnboardingFlow() {
  const { locale, t, setLocale } = useI18n();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionKey = useMemo(() => getV1OnboardingSessionQueryKey({ locale }), [locale]);

  const formData = useWizardStore((s) => s.formData);
  const setFormData = useWizardStore((s) => s.setFormData);
  const items = useWizardStore((s) => s.items);
  const setItems = useWizardStore((s) => s.setItems);

  const [fallbackSession, setFallbackSession] = useState<OnboardingSession | null>(null);
  const [noItemsAck, setNoItemsAck] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completeError, setCompleteError] = useState("");
  const [flowStepId, setFlowStepId] = useState<FlowStepId>("language");
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [phoneCountryIso, setPhoneCountryIso] = useState<string | undefined>(undefined);
  const [attemptedSteps, setAttemptedSteps] = useState<ReadonlySet<string>>(() => new Set());
  const [saveError, setSaveError] = useState("");
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
  const currentStep = editStep ?? backendStepForFlow(session, flowStep);
  const flowFields = editStep ? visibleFields(editStep) : fieldsForFlowStep(currentStep, flowStep);
  const activeFieldKeys = editStep ? undefined : flowStep?.fieldKeys;
  const stepIsEmpty = isSectionStep(currentStep)
    ? items.length === 0
    : isFormStepEmpty(flowFields, formData);

  const retryLoad = async () => {
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
    mutation: { onSuccess: (data) => void persistSession(data) },
  });
  const gotoStep = usePostV1OnboardingSessionGoto({
    mutation: { onSuccess: (data) => void persistSession(data) },
  });
  const extras = usePostV1OnboardingSessionExtras({
    mutation: { onSuccess: (data) => void persistSession(data) },
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
    if (!session || resyncedStepRef.current) return;
    resyncedStepRef.current = true;
    const resumed = flowStepForBackendStep(session, session.currentStep);
    if (!resumed) return;
    setFlowStepId(resumed.id);
    if (countedIndexOf(resumed.id) > 0 && !resumeDismissedRef.current) {
      const phase = phaseForFlowStep(resumed.id);
      setResumeBanner({ phaseLabel: phase ? t(phase.labelKey) : "" });
    }
  }, [session, t]);

  useEffect(() => {
    void readPhoneCountry().then((iso) => {
      if (iso) setPhoneCountryIso(iso);
      else setPhoneCountryIso((prev) => prev ?? defaultCountryFromLocale(locale));
    });
  }, [locale]);

  useEffect(() => {
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
    if (!session) return;
    const backendStepId = currentStep?.id;
    if (prevBackendStepIdRef.current === backendStepId) return;
    prevBackendStepIdRef.current = backendStepId;
    const saved = getSavedDataForStep(session, currentStep);
    setFormData(saved);
    setItems(getSavedItemsForStep(session, currentStep));
    setNoItemsAck(false);
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
  }, [currentStep, session, attemptedSteps, setFormData, setItems]);

  useEffect(() => {
    if (flowStepId !== "headline" || editStepId) return;
    const workStep = session?.steps.find((step) => step.sectionTypeKey === "work_experience_v1");
    const suggested = suggestHeadlineFromExperience(getSavedItemsForStep(session, workStep));
    if (!suggested) return;
    setFormData((prev) => (prev.headline?.trim() ? prev : { ...prev, headline: suggested }));
  }, [flowStepId, editStepId, session, setFormData]);

  useEffect(() => {
    if (!currentStep) return;
    void saveStepDraft(currentStep.id, formData, items);
  }, [currentStep, formData, items]);

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
      const payload = isSectionStep(currentStep)
        ? buildSkipPayload()
        : buildNextPayload(currentStep, formData, items);
      if (!(await commitSave(currentStep.id, payload, false))) return;
    }
    advanceFlow();
  }

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
    const invalidStepId = firstInvalidProfileStep();
    if (invalidStepId) {
      markAttempted(invalidStepId);
      setEditStepId(invalidStepId);
      setCompleteError(t("onboarding.fixBeforeComplete"));
      return;
    }
    complete.mutate();
  }

  function markWelcomeSeenAndAdvance() {
    welcomeSeenRef.current = true;
    void markWelcomeSeen();
    advanceFlow();
  }

  function setPhoneCountry(iso: string) {
    setPhoneCountryIso(iso);
    void savePhoneCountry(iso);
  }

  return {
    // i18n + viewport
    locale,
    t,
    setLocale,
    width,
    height,
    // session + derived step
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
    // draft
    formData,
    setFormData,
    items,
    setItems,
    // step-local ui state
    errors,
    setErrors,
    noItemsAck,
    setNoItemsAck,
    phoneCountryIso,
    setPhoneCountry,
    resumeBanner,
    saveError,
    completeError,
    // mutation flags
    isPending,
    nextStep,
    gotoStep,
    extras,
    complete,
    // actions
    retryLoad,
    handleNext,
    handleSkip,
    handleBack,
    handleGoto,
    handleComplete,
    handleAddSection,
    retrySave,
    dismissResumeBanner,
    markWelcomeSeenAndAdvance,
  };
}
