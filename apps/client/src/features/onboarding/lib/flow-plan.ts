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
  | "welcome"
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
  /** Intro screens (welcome) sit outside the counted progress — they don't
   *  show the masthead and aren't part of the "NN / NN" total or time estimate. */
  readonly intro?: boolean;
}

/** A named, contiguous group of counted steps, surfaced in the masthead. */
export interface FlowPhase {
  readonly key: "identity" | "history" | "resume";
  readonly labelKey: string;
  readonly stepIds: readonly FlowStepId[];
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
    // Shown AFTER the language pick so the value-prop reads in the chosen
    // language; an intro screen (no masthead, not part of the NN/NN count).
    id: "welcome",
    kind: "local",
    optional: false,
    intro: true,
    titleKey: "onboarding.flow.welcome.title",
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
    // Headline + the longer bio (summary) share this step; the cargo field
    // (jobTitle) was removed — the role now comes from work experience.
    // Non-optional: the backend requires `summary` (min 10) at complete, so the
    // step can't be skipped — `headline` itself stays optional.
    fieldKeys: ["headline", "summary"],
    optional: false,
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

/**
 * Named phases over the counted steps (welcome is excluded). Each phase covers
 * a contiguous range so the masthead can show "Identidade / Histórico /
 * Currículo" alongside the step counter.
 */
export const FLOW_PHASES: readonly FlowPhase[] = [
  {
    key: "identity",
    labelKey: "onboarding.flow.phases.identity",
    stepIds: ["language", "location", "personal", "username"],
  },
  {
    key: "history",
    labelKey: "onboarding.flow.phases.history",
    stepIds: ["experience", "headline", "links", "education"],
  },
  {
    key: "resume",
    labelKey: "onboarding.flow.phases.resume",
    stepIds: ["resume-style", "review"],
  },
] as const;

/** Rough per-step time weights (seconds) used only for the "~N min restantes"
 *  estimate. Approximate by design — they drive a hint, not a contract. */
const STEP_SECONDS: Record<FlowStepId, number> = {
  welcome: 0,
  language: 5,
  location: 20,
  personal: 30,
  username: 20,
  experience: 45,
  headline: 35,
  links: 25,
  education: 45,
  "resume-style": 20,
  review: 15,
};

export function flowIndexOf(id: FlowStepId): number {
  return FLOW_PLAN.findIndex((step) => step.id === id);
}

/** The counted steps (everything except intro screens), in order. */
export function countedFlowSteps(): FlowStep[] {
  return FLOW_PLAN.filter((step) => !step.intro);
}

/** 0-based index of a step within the counted steps, or -1 for intro steps. */
export function countedIndexOf(id: FlowStepId): number {
  return countedFlowSteps().findIndex((step) => step.id === id);
}

export function countedTotal(): number {
  return countedFlowSteps().length;
}

export function phaseForFlowStep(id: FlowStepId): FlowPhase | undefined {
  return FLOW_PHASES.find((phase) => phase.stepIds.includes(id));
}

/** Estimated seconds left from the given step to the end (current step
 *  inclusive). Intro steps estimate from the first counted step. */
export function estimatedRemainingSeconds(id: FlowStepId): number {
  const counted = countedFlowSteps();
  const from = Math.max(0, countedIndexOf(id));
  return counted.slice(from).reduce((sum, step) => sum + STEP_SECONDS[step.id], 0);
}

/** Whole-minute remaining estimate, floored at 1 so it never reads "~0 min". */
export function estimatedRemainingMinutes(id: FlowStepId): number {
  return Math.max(1, Math.round(estimatedRemainingSeconds(id) / 60));
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
