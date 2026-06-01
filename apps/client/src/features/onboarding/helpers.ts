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

export function validateStepFields(step: OnboardingStep, data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of visibleFields(step)) {
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
): boolean {
  if (!step || isReviewStep(step) || isWelcomeStep(step)) return true;
  if (isSectionStep(step)) return !step.required || items.length > 0;
  return Object.keys(validateStepFields(step, data)).length === 0;
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

export function extrasToActivate(session: OnboardingSession | undefined): string[] {
  if (!session?.availableExtras?.length) return [];
  const alreadyActive = new Set(session.activatedExtras ?? []);
  return session.availableExtras
    .map((step) => step.id)
    .filter((id) => ACTIVATED_EXTRA_STEP_IDS.includes(id) && !alreadyActive.has(id));
}
