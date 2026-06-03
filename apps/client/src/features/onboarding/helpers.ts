import type { FlowStep, FlowStepId } from "./flow/flowPlan";
import { FLOW_PLAN, flowStepsForServerStep } from "./flow/flowPlan";
import type {
  FormData,
  OnboardingField,
  OnboardingSession,
  OnboardingStep,
  ResumeStyleOption,
  ReviewSection,
  SectionItem,
} from "./types";

const REQUIRED_MESSAGE = "Campo obrigatório";
const INVALID_URL_MESSAGE = "Informe uma URL válida";
const INVALID_PATTERN_MESSAGE = "Formato inválido";

export const ACTIVATED_EXTRA_STEP_IDS = ["section:project_v1", "section:certification_v1"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function isWelcomeStep(step: OnboardingStep | undefined): boolean {
  return step?.component === "welcome" || step?.id === "welcome";
}

export function isReviewStep(step: OnboardingStep | undefined): boolean {
  return step?.component === "review" || step?.id === "review";
}

export function isResumeStyleStep(step: OnboardingStep | undefined): boolean {
  return step?.component === "resume-style" || step?.id === "resume-style";
}

export function isSectionStep(step: OnboardingStep | undefined): boolean {
  return Boolean(
    step?.multipleItems || step?.component === "generic-section" || step?.sectionTypeKey,
  );
}

export function isOptionalStep(step: OnboardingStep | undefined): boolean {
  if (!step) return false;
  if (isSectionStep(step)) return true;
  return !(step.fields ?? []).some((field) => field.required);
}

export function visibleFields(step: OnboardingStep | undefined): OnboardingField[] {
  return step?.fields ?? [];
}

/**
 * Resolve the backend step a flow step renders/persists to. Form/style steps
 * map by `serverStepId`; section steps map by `serverSectionKey` (the section
 * type, not the `section:<key>` id). Local/review flow steps have no backend
 * step and return `undefined`.
 */
export function backendStepForFlow(
  session: OnboardingSession | undefined,
  flow: FlowStep | undefined,
): OnboardingStep | undefined {
  if (!session || !flow) return undefined;
  if (flow.serverSectionKey) {
    return session.steps.find((step) => step.sectionTypeKey === flow.serverSectionKey);
  }
  if (flow.serverStepId) {
    return session.steps.find((step) => step.id === flow.serverStepId);
  }
  return undefined;
}

/** Slice a backend step's fields down to the flow step's `fieldKeys`,
 *  preserving backend order. No `fieldKeys` → all fields (back-compat). */
export function fieldsForFlowStep(
  step: OnboardingStep | undefined,
  flow: FlowStep | undefined,
): OnboardingField[] {
  const fields = visibleFields(step);
  const keys = flow?.fieldKeys;
  if (!keys) return fields;
  return fields.filter((field) => keys.includes(field.key));
}

/** Is this the LAST flow step that persists to its backend step? Several flow
 *  steps can share one backend step (headline+links → professional-profile);
 *  only the last one submits the accumulated payload. Sections/style/local are
 *  always "last" (single-mapped). */
export function isLastFlowStepForBackend(flow: FlowStep | undefined): boolean {
  if (!flow?.serverStepId) return true;
  const siblings = flowStepsForServerStep(flow.serverStepId);
  return siblings[siblings.length - 1]?.id === flow.id;
}

/** Map a backend step id back to the FIRST flow step that renders it — used to
 *  initialise the flow cursor when resuming a persisted session. */
export function flowStepForBackendStep(
  session: OnboardingSession | undefined,
  backendStepId: string | null | undefined,
): FlowStep | undefined {
  if (!session || !backendStepId) return undefined;
  return FLOW_PLAN.find((flow) => backendStepForFlow(session, flow)?.id === backendStepId);
}

export function getSavedDataForStep(
  session: OnboardingSession | undefined,
  step: OnboardingStep | undefined,
): FormData {
  if (!session || !step) return {};
  if (isResumeStyleStep(step)) {
    return session.resumeStyleId ? { resumeStyleId: session.resumeStyleId } : {};
  }

  const fields = visibleFields(step);
  if (fields.length === 0) return {};

  const personalInfo = session.personalInfo as Record<string, unknown> | undefined;
  const professionalProfile = session.professionalProfile as Record<string, unknown> | undefined;
  const topLevel = session as unknown as Record<string, unknown>;

  const data: FormData = {};
  for (const field of fields) {
    const value =
      personalInfo?.[field.key] ?? professionalProfile?.[field.key] ?? topLevel[field.key];
    const text = stringifyValue(value);
    if (text.length > 0) data[field.key] = text;
  }
  return data;
}

export function getSavedItemsForStep(
  session: OnboardingSession | undefined,
  step: OnboardingStep | undefined,
): SectionItem[] {
  if (!session || !step?.sectionTypeKey) return [];
  const section = session.sections?.find((item) => item.sectionTypeKey === step.sectionTypeKey);
  return (section?.items ?? []).map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    content: item.content ?? {},
  }));
}

export function validateStepFields(
  step: OnboardingStep,
  data: FormData,
  fieldKeys?: readonly string[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of visibleFields(step)) {
    if (fieldKeys && !fieldKeys.includes(field.key)) continue;
    const value = data[field.key]?.trim() ?? "";
    if (field.required && value.length === 0) {
      errors[field.key] = REQUIRED_MESSAGE;
      continue;
    }
    if (value.length === 0) continue;
    if (field.minLength !== undefined && value.length < field.minLength) {
      errors[field.key] = `Mínimo de ${field.minLength} caracteres`;
      continue;
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      errors[field.key] = `Máximo de ${field.maxLength} caracteres`;
      continue;
    }
    if ((field.type === "url" || field.key === "website") && !/^https?:\/\/\S+/i.test(value)) {
      errors[field.key] = INVALID_URL_MESSAGE;
      continue;
    }
    if (field.pattern) {
      try {
        if (!new RegExp(field.pattern).test(value)) errors[field.key] = INVALID_PATTERN_MESSAGE;
      } catch {
        // Backend owns malformed dynamic patterns; keep the UI usable.
      }
    }
  }
  return errors;
}

export function canContinueStep(
  step: OnboardingStep | undefined,
  data: FormData,
  items: SectionItem[],
  fieldKeys?: readonly string[],
): boolean {
  if (!step || isReviewStep(step) || isWelcomeStep(step)) return true;
  if (isSectionStep(step)) return !step.required || items.length > 0;
  return Object.keys(validateStepFields(step, data, fieldKeys)).length === 0;
}

export function buildNextPayload(
  step: OnboardingStep | undefined,
  data: FormData,
  items: SectionItem[],
) {
  if (!step) return {};
  if (isSectionStep(step)) return { items };
  return data;
}

export function buildSkipPayload() {
  return { noData: true };
}

export function parseResumeStyles(step: OnboardingStep | undefined): ResumeStyleOption[] {
  const raw = step?.data;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((item) => ({
      id: stringifyValue(item.id),
      name: stringifyValue(item.name) || stringifyValue(item.label) || "Style",
      description: stringifyValue(item.description) || null,
      category: stringifyValue(item.category),
      tags: Array.isArray(item.tags) ? item.tags.map(stringifyValue).filter(Boolean) : [],
      atsScore: typeof item.atsScore === "number" ? item.atsScore : null,
      thumbnailUrl: stringifyValue(item.thumbnailUrl) || null,
    }))
    .filter((item) => item.id.length > 0);
}

export function itemSummary(item: SectionItem): string {
  if (!item.content) return "---";
  const values = Object.values(item.content).map(stringifyValue).filter(Boolean);
  return values.slice(0, 3).join(" · ") || "---";
}

export function buildReviewSections(
  session: OnboardingSession,
  steps: OnboardingStep[],
): ReviewSection[] {
  const result: ReviewSection[] = [];

  const personalStep = steps.find((step) => step.id === "personal-info");
  if (session.personalInfo && personalStep) {
    const entries = fieldsToEntries(personalStep, session.personalInfo);
    if (entries.length > 0) {
      result.push({ label: personalStep.label, stepId: personalStep.id, entries });
    }
  }

  const usernameStep = steps.find((step) => step.id === "username");
  if (session.username && usernameStep) {
    result.push({
      label: usernameStep.label,
      stepId: usernameStep.id,
      entries: [{ label: "", value: `@${session.username}` }],
    });
  }

  const profileStep = steps.find((step) => step.id === "professional-profile");
  if (session.professionalProfile && profileStep) {
    const entries = fieldsToEntries(profileStep, session.professionalProfile, "summary");
    if (entries.length > 0) {
      result.push({ label: profileStep.label, stepId: profileStep.id, entries });
    }
  }

  for (const section of session.sections ?? []) {
    const step = steps.find((candidate) => candidate.id === `section:${section.sectionTypeKey}`);
    if (!step) continue;
    if (section.noData || !section.items?.length) {
      result.push({ label: step.label, stepId: step.id, entries: [], skipped: true });
      continue;
    }
    result.push({
      label: step.label,
      stepId: step.id,
      entries: section.items.map((item) => ({ label: "", value: itemSummary(item) })),
    });
  }

  const styleStep = steps.find((step) => isResumeStyleStep(step));
  const selectedStyle = parseResumeStyles(styleStep).find(
    (style) => style.id === session.resumeStyleId,
  );
  if (styleStep && session.resumeStyleId) {
    result.push({
      label: styleStep.label,
      stepId: styleStep.id,
      entries: [],
      styleName: selectedStyle?.name ?? session.resumeStyleId,
      stylePreviewUrl: selectedStyle?.thumbnailUrl ?? null,
    });
  }

  return result;
}

function fieldsToEntries(
  step: OnboardingStep,
  data: Record<string, unknown>,
  longKey?: string,
): ReviewSection["entries"] {
  return visibleFields(step)
    .map((field) => ({
      label: field.label,
      value: stringifyValue(data[field.key]),
      long: field.key === longKey,
    }))
    .filter((entry) => entry.value.length > 0);
}

/** A required-but-incomplete step surfaced on the review hub, with the linear
 *  flow step to jump to (when one exists — extras are edited via overlay). */
export interface MissingRequiredTarget {
  /** Backend step id (also the overlay edit target). */
  readonly stepId: string;
  /** Linear flow step that owns this backend step, if any. */
  readonly flowStepId?: FlowStepId;
  readonly label: string;
}

/** Map `session.missingRequired` (backend step ids, or occasionally a field
 *  key) to actionable targets the review banner can link to. */
export function missingRequiredTargets(
  session: OnboardingSession | undefined,
): MissingRequiredTarget[] {
  const ids = session?.missingRequired ?? [];
  if (ids.length === 0 || !session) return [];
  return ids.map((id) => {
    const byId = session.steps.find((step) => step.id === id);
    const byField = byId
      ? undefined
      : session.steps.find((step) => (step.fields ?? []).some((field) => field.key === id));
    const flow = flowStepForBackendStep(session, byId?.id ?? byField?.id);
    const fieldLabel = byField?.fields?.find((field) => field.key === id)?.label;
    return {
      stepId: byId?.id ?? byField?.id ?? id,
      ...(flow ? { flowStepId: flow.id } : {}),
      label: byId?.label ?? fieldLabel ?? byField?.label ?? id,
    };
  });
}

/** Map a device/UI locale to a default ISO country, used to pre-suggest the
 *  phone country and location before the user types. Only a hint — the user
 *  confirms/edits. */
export function defaultCountryFromLocale(locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  const lower = locale.toLowerCase();
  if (lower.startsWith("pt")) return "BR";
  if (lower.startsWith("en")) return "US";
  const region = lower.split(/[-_]/)[1];
  return region ? region.toUpperCase() : undefined;
}

export type AtsBandKey = "high" | "good" | "fair";

/** Bucket an ATS score into a band whose label/blurb copy lives under
 *  `onboarding.ats.<band>` in the dictionaries. */
export function atsBand(score: number | null | undefined): AtsBandKey | null {
  if (typeof score !== "number") return null;
  if (score >= 90) return "high";
  if (score >= 75) return "good";
  return "fair";
}

export function extrasToActivate(session: OnboardingSession | undefined): string[] {
  if (!session?.availableExtras?.length) return [];
  const alreadyActive = new Set(session.activatedExtras ?? []);
  return session.availableExtras
    .map((step) => step.id)
    .filter((id) => ACTIVATED_EXTRA_STEP_IDS.includes(id) && !alreadyActive.has(id));
}
