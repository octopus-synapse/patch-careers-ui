/**
 * Onboarding flow orchestration (ADR-0002/0004) — the wizard's state machine,
 * extracted from the render so onboarding-wizard.tsx is just chrome + steps.
 *
 * Owns: the backend session (query + optimistic snapshot), the app-side flow
 * cursor, the per-step draft (via the scoped wizard store), validation gating,
 * resume state and the save/navigate handlers. Returns a view-model
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { CLASSIC_RESUME_STYLE_ID } from "@/config/classic-resume-style";
import { type BillingOfferCode, createBillingCheckoutRoute } from "@/features/billing";
import { translateBackendCode } from "@/lib/errors/backend-error";
import { getCompletedOnboardingRoute } from "@/navigation/auth-redirect";
import { useAppRouter } from "@/navigation/use-app-router";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  getPersistedFlow,
  movePersistedFlow,
  type OnboardingPlan,
  savePersistedDraft,
} from "../lib/flow-api";
import {
  FLOW_PLAN,
  type FlowStep,
  type FlowStepId,
  flowIndexOf,
  nextFlowStep,
  prevFlowStep,
} from "../lib/flow-plan";
import {
  backendStepForFlow,
  buildNextPayload,
  buildSkipPayload,
  canContinueStep,
  defaultCountryFromLocale,
  fieldsForFlowStep,
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
  clearSessionSnapshot,
  clearStepDraft,
  readPhoneCountry,
  readSessionSnapshot,
  readStepDraft,
  savePhoneCountry,
  saveSessionSnapshot,
  saveStepDraft,
} from "../lib/storage";
import { suggestUsernameFromName } from "../lib/suggestions";
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
  const router = useAppRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthState();
  const sessionKey = useMemo(() => getV1OnboardingSessionQueryKey({ locale }), [locale]);

  const formData = useWizardStore((s) => s.formData);
  const setFormData = useWizardStore((s) => s.setFormData);
  const items = useWizardStore((s) => s.items);
  const setItems = useWizardStore((s) => s.setItems);

  const [fallbackSession, setFallbackSession] = useState<OnboardingSession | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completeError, setCompleteError] = useState("");
  const [flowStepId, setFlowStepId] = useState<FlowStepId>("language");
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [phoneCountryIso, setPhoneCountryIso] = useState<string | undefined>(undefined);
  const [attemptedSteps, setAttemptedSteps] = useState<ReadonlySet<string>>(() => new Set());
  const [saveError, setSaveError] = useState("");
  const [flowMoving, setFlowMoving] = useState(false);
  const refreshedAuthRef = useRef(false);
  const flowQuery = useQuery({
    queryKey: ["onboarding-flow", currentUser?.email],
    queryFn: getPersistedFlow,
    enabled: Boolean(currentUser),
  });
  const persistedFlow = flowQuery.data;
  const persistedStep = persistedFlow?.step;
  const selectedLocale = persistedFlow?.selectedLocale;
  const paymentResumeStep = persistedStep === "payment" ? persistedFlow?.resumeStep : undefined;
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
    refreshedAuthRef.current = false;
    await Promise.all([sessionQuery.refetch(), flowQuery.refetch()]);
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
        await finishOnboarding();
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
    nextStep.isPending ||
    gotoStep.isPending ||
    extras.isPending ||
    complete.isPending ||
    flowMoving;

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
    if (persistedStep) setFlowStepId(persistedStep);
  }, [persistedStep]);

  useEffect(() => {
    if (selectedLocale && selectedLocale !== locale) {
      void setLocale(selectedLocale as "en" | "pt-BR");
    }
  }, [selectedLocale, locale, setLocale]);

  useEffect(() => {
    void readPhoneCountry().then((iso) => {
      if (iso) setPhoneCountryIso(iso);
      else setPhoneCountryIso((prev) => prev ?? defaultCountryFromLocale(locale));
    });
  }, [locale]);

  useEffect(() => {
    if (!session) return;
    const backendStepId = currentStep?.id;
    const draftKey = `${backendStepId}:${flowStepId}`;
    if (prevBackendStepIdRef.current === draftKey) return;
    prevBackendStepIdRef.current = draftKey;
    const saved = getSavedDataForStep(session, currentStep);
    // Prefill so typing steps become confirming steps: the signup name seeds
    // personal-info, and the name seeds a username suggestion (the live
    // availability check runs on it like any typed value).
    if (backendStepId === "personal-info" && !saved.fullName?.trim() && currentUser?.name) {
      saved.fullName = currentUser.name;
    }
    if (backendStepId === "username" && !saved.username?.trim() && !session.username) {
      const personalInfo = session.personalInfo as Record<string, unknown> | undefined;
      const sourceName =
        typeof personalInfo?.fullName === "string" && personalInfo.fullName.trim()
          ? personalInfo.fullName
          : (currentUser?.name ?? "");
      const suggested = suggestUsernameFromName(sourceName);
      if (suggested) saved.username = suggested;
    }
    setFormData(saved);
    setItems(getSavedItemsForStep(session, currentStep));
    setErrors(
      backendStepId && currentStep && attemptedSteps.has(backendStepId)
        ? validateStepFields(currentStep, saved, t)
        : {},
    );
    if (!backendStepId) return;
    const siblingDraftId =
      flowStepId === "personal" ? "location" : flowStepId === "links" ? "headline" : null;
    const siblingDraft = siblingDraftId
      ? (persistedFlow?.drafts[siblingDraftId] as
          | { data?: Record<string, string>; items?: typeof items }
          | undefined)
      : undefined;
    if (siblingDraft?.data) setFormData((prev) => ({ ...prev, ...siblingDraft.data }));
    const serverDraft = persistedFlow?.drafts[flowStepId] as
      | { data?: Record<string, string>; items?: typeof items }
      | undefined;
    if (serverDraft?.data) setFormData((prev) => ({ ...prev, ...serverDraft.data }));
    if (serverDraft?.items) setItems(serverDraft.items);
    void readStepDraft(backendStepId).then((draft) => {
      if (!draft || prevBackendStepIdRef.current !== draftKey) return;
      if (serverDraft) return;
      if (Object.keys(draft.data).length > 0) setFormData((prev) => ({ ...prev, ...draft.data }));
      if (draft.items.length > 0) setItems(draft.items);
    });
  }, [
    currentStep,
    session,
    attemptedSteps,
    currentUser,
    setFormData,
    setItems,
    t,
    persistedFlow?.drafts,
    flowStepId,
  ]);

  useEffect(() => {
    if (!currentStep) return;
    void saveStepDraft(currentStep.id, formData, items);
  }, [currentStep, formData, items]);

  const canSaveDraft = Boolean(currentStep) && persistedStep === flowStepId;
  useEffect(() => {
    if (!canSaveDraft) return;
    const timer = setTimeout(() => {
      void savePersistedDraft(flowStepId, { data: formData, items }).catch(() => undefined);
    }, 850);
    return () => clearTimeout(timer);
  }, [canSaveDraft, flowStepId, formData, items]);

  async function moveTo(
    to: FlowStepId,
    options?: { locale?: "en" | "pt-BR"; plan?: OnboardingPlan; offerCode?: BillingOfferCode },
  ) {
    setSaveError("");
    setFlowMoving(true);
    try {
      const next = await movePersistedFlow({ to, ...options });
      queryClient.setQueryData(["onboarding-flow", currentUser?.email], next);
      setFlowStepId(next.step);
      return true;
    } catch {
      setSaveError(t("onboarding.saveFailed"));
      return false;
    } finally {
      setFlowMoving(false);
    }
  }

  async function handlePlanContinue(plan: OnboardingPlan, offerCode?: BillingOfferCode) {
    if (
      !(await moveTo(plan === "free" ? (persistedFlow?.resumeStep ?? "location") : "payment", {
        plan,
        ...(offerCode ? { offerCode } : {}),
      }))
    )
      return;
    if (plan === "free" || !offerCode) return;
    try {
      router.push(await createBillingCheckoutRoute(offerCode));
    } catch {
      setSaveError(t("go.checkoutError"));
    }
  }

  async function handleOpenPayment() {
    if (!persistedFlow?.selectedOfferCode) return;
    setSaveError("");
    try {
      router.push(await createBillingCheckoutRoute(persistedFlow.selectedOfferCode));
    } catch {
      setSaveError(t("go.checkoutError"));
    }
  }

  useEffect(() => {
    if (flowStepId !== "payment" || !paymentResumeStep) return;
    const check = () => {
      void movePersistedFlow({ to: paymentResumeStep })
        .then((next) => {
          queryClient.setQueryData(["onboarding-flow", currentUser?.email], next);
          setFlowStepId(next.step);
        })
        .catch(() => undefined);
    };
    check();
    const interval = setInterval(check, 4000);
    return () => clearInterval(interval);
  }, [flowStepId, paymentResumeStep, queryClient, currentUser?.email]);

  async function saveBackendStep(
    stepId: string,
    payload: NonNullable<Parameters<typeof nextStep.mutateAsync>[0]["data"]>,
  ) {
    await gotoStep.mutateAsync({ data: { stepId }, params: { locale } });
    await nextStep.mutateAsync({ data: payload, params: { locale } });
    await clearStepDraft(stepId);
  }

  async function persistCurrentDraft(): Promise<boolean> {
    if (!currentStep || flowStepId !== persistedStep) return true;
    try {
      await savePersistedDraft(flowStepId, { data: formData, items });
      return true;
    } catch {
      setSaveError(t("onboarding.saveFailed"));
      return false;
    }
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

  async function advanceFromEducation() {
    // The backend still requires its style step. Persist Clássico invisibly
    // before showing review, including when the education step was skipped.
    if (!(await commitSave("resume-style", { resumeStyleId: CLASSIC_RESUME_STYLE_ID }, false)))
      return;
    await moveTo("review");
  }

  async function advanceFlow() {
    const nextFlow = nextFlowStep(flowStepId);
    if (nextFlow && (await persistCurrentDraft())) await moveTo(nextFlow.id);
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
    if (flowStepId === "language") {
      await moveTo("plan", { locale });
      return;
    }
    if (flowStepId === "plan" || flowStepId === "payment") return;
    if (editStep) {
      const editErrors = validateStepFields(editStep, formData, t);
      setErrors(editErrors);
      if (!canContinueStep(editStep, formData, items, t)) {
        markAttempted(editStep.id);
        return;
      }
      if (await commitSave(editStep.id, buildNextPayload(editStep, formData, items), true)) {
        setEditStepId(null);
      }
      return;
    }
    if (currentStep) {
      // Optional steps left empty skip directly — no acknowledgement gate.
      if (flowStep.optional && stepIsEmpty) {
        await handleSkip();
        return;
      }
      const nextErrors = validateStepFields(currentStep, formData, t, activeFieldKeys);
      setErrors(nextErrors);
      if (!canContinueStep(currentStep, formData, items, t, activeFieldKeys)) {
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
    if (flowStepId === "education") await advanceFromEducation();
    else await advanceFlow();
  }

  async function handleSkip() {
    if (!flowStep || isPending) return;
    if (currentStep && isLastFlowStepForBackend(flowStep)) {
      const payload = isSectionStep(currentStep)
        ? buildSkipPayload()
        : buildNextPayload(currentStep, formData, items);
      if (!(await commitSave(currentStep.id, payload, false))) return;
    }
    if (flowStepId === "education") await advanceFromEducation();
    else await advanceFlow();
  }

  async function retrySave() {
    const pending = lastSaveRef.current;
    if (isPending) return;
    if (!pending) {
      if (await persistCurrentDraft()) setSaveError("");
      return;
    }
    if (!(await commitSave(pending.stepId, pending.payload, pending.isEdit))) return;
    if (pending.isEdit) setEditStepId(null);
    else if (pending.stepId === "resume-style") await moveTo("review");
    else if (flowStepId === "education") await advanceFromEducation();
    else await advanceFlow();
  }

  async function handleBack() {
    if (isPending) return;
    setSaveError("");
    if (!(await persistCurrentDraft())) return;
    if (editStep) {
      setEditStepId(null);
      return;
    }
    const prev =
      flowStepId === persistedFlow?.resumeStep && persistedFlow?.selectedPlan === "free"
        ? FLOW_PLAN[1]
        : prevFlowStep(flowStepId);
    if (prev) await moveTo(prev.id);
  }

  function handleGoto(stepId: string) {
    if (isPending) return;
    setEditStepId(stepId);
  }

  function firstInvalidProfileStep(): string | null {
    if (!session) return null;
    for (const step of session.steps) {
      if (isSectionStep(step) || isResumeStyleStep(step)) continue;
      const stepErrors = validateStepFields(step, getSavedDataForStep(session, step), t);
      if (Object.keys(stepErrors).length > 0) return step.id;
    }
    return null;
  }

  async function handleComplete() {
    setCompleteError("");
    if (session?.missingRequired?.some((id) => id !== "resume-style" && id !== "resumeStyleId")) {
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
    // The locale the person did onboarding in becomes the resume's canonical
    // language (backend ADR-003 §10); the backend falls back to Accept-Language.
    if (session?.resumeStyleId !== CLASSIC_RESUME_STYLE_ID) {
      if (!(await commitSave("resume-style", { resumeStyleId: CLASSIC_RESUME_STYLE_ID }, false)))
        return;
    }
    complete.mutate({ params: { locale } });
  }

  /** Refresh auth so guarded routes unlock, then enter the app. */
  async function finishOnboarding() {
    await bootstrap().catch(() => undefined);
    router.replace(getCompletedOnboardingRoute());
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
    flowQuery,
    persistedFlow,
    fallbackSession,
    session,
    flowStep,
    flowStepId,
    setFlowStepId,
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
    phoneCountryIso,
    setPhoneCountry,
    saveError,
    completeError,
    // mutation flags
    isPending,
    nextStep,
    gotoStep,
    extras,
    complete,
    // actions
    commitSave,
    retryLoad,
    handleNext,
    handlePlanContinue,
    handleOpenPayment,
    moveTo,
    handleSkip,
    handleBack,
    handleGoto,
    handleComplete,
    handleAddSection,
    retrySave,
  };
}
