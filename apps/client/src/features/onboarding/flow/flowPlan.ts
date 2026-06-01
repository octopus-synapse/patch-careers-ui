/**
 * App-owned onboarding flow plan.
 *
 * The backend session still owns persistence, field definitions, validation
 * and section/extra catalogs — but the ORDER and UX are now driven here, not
 * by `session.steps`. Each flow step maps to a backend step/section so the
 * app keeps POSTing to the existing session endpoints (`save`/`goto`/...).
 *
 * Note: several flow steps map to the SAME backend step — `location` and
 * `personal` both write `personal-info`; `headline` and `links` both write
 * `professional-profile`. Each flow step declares the `fieldKeys` it owns so
 * the flow controller can accumulate a per-backend-step payload across them
 * and save the merged object (never clobbering a sibling step's fields).
 */

export type FlowStepId =
  | "language"
  | "location"
  | "personal"
  | "username"
  | "experience"
  | "headline"
  | "links"
  | "education"
  | "resume-style"
  | "review";

export type FlowStepKind = "local" | "form" | "section" | "style" | "review";

export interface FlowStep {
  readonly id: FlowStepId;
  readonly kind: FlowStepKind;
  /** Backend step id this flow step persists to (form/style steps). */
  readonly serverStepId?: string;
  /** Backend section type key (section steps). */
  readonly serverSectionKey?: string;
  /** Backend field keys this flow step renders/owns. Used to slice the
   *  rendered inputs and to accumulate the merged payload for steps that
   *  share a backend step. */
  readonly fieldKeys?: readonly string[];
  /** When true, the step can be skipped (no required data to proceed). */
  readonly optional: boolean;
  /** i18n key for the step title. */
  readonly titleKey: string;
}

/**
 * The canonical linear order. The review hub (last) surfaces optional
 * sections (skills, languages, projects, certifications, awards,
 * publications) via the backend `availableExtras` mechanism — those are NOT
 * linear flow steps.
 */
export const FLOW_PLAN: readonly FlowStep[] = [
  {
    id: "language",
    kind: "local",
    optional: false,
    titleKey: "onboarding.flow.language.title",
  },
  {
    id: "location",
    kind: "form",
    serverStepId: "personal-info",
    fieldKeys: ["location"],
    optional: false,
    titleKey: "onboarding.flow.location.title",
  },
  {
    id: "personal",
    kind: "form",
    serverStepId: "personal-info",
    fieldKeys: ["fullName", "phone"],
    optional: false,
    titleKey: "onboarding.flow.personal.title",
  },
  {
    id: "username",
    kind: "form",
    serverStepId: "username",
    fieldKeys: ["username"],
    optional: false,
    titleKey: "onboarding.flow.username.title",
  },
  {
    id: "experience",
    kind: "section",
    serverSectionKey: "work_experience_v1",
    optional: true,
    titleKey: "onboarding.flow.experience.title",
  },
  {
    id: "headline",
    kind: "form",
    serverStepId: "professional-profile",
    fieldKeys: ["headline"],
    optional: true,
    titleKey: "onboarding.flow.headline.title",
  },
  {
    id: "links",
    kind: "form",
    serverStepId: "professional-profile",
    fieldKeys: ["linkedin", "github", "website", "portfolio"],
    optional: true,
    titleKey: "onboarding.flow.links.title",
  },
  {
    id: "education",
    kind: "section",
    serverSectionKey: "education_v1",
    optional: true,
    titleKey: "onboarding.flow.education.title",
  },
  {
    id: "resume-style",
    kind: "style",
    serverStepId: "resume-style",
    fieldKeys: ["resumeStyleId"],
    optional: false,
    titleKey: "onboarding.flow.resumeStyle.title",
  },
  {
    id: "review",
    kind: "review",
    optional: false,
    titleKey: "onboarding.flow.review.title",
  },
] as const;

export function flowIndexOf(id: FlowStepId): number {
  return FLOW_PLAN.findIndex((step) => step.id === id);
}

export function flowStepAt(index: number): FlowStep | undefined {
  return FLOW_PLAN[index];
}

export function nextFlowStep(id: FlowStepId): FlowStep | undefined {
  const index = flowIndexOf(id);
  return index < 0 ? undefined : FLOW_PLAN[index + 1];
}

export function prevFlowStep(id: FlowStepId): FlowStep | undefined {
  const index = flowIndexOf(id);
  return index <= 0 ? undefined : FLOW_PLAN[index - 1];
}

/** All flow steps that persist to the given backend step id, in order.
 *  Used to compute the merged payload owned by sibling flow steps. */
export function flowStepsForServerStep(serverStepId: string): FlowStep[] {
  return FLOW_PLAN.filter((step) => step.serverStepId === serverStepId);
}
