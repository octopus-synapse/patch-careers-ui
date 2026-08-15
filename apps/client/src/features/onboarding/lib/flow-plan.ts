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
  | "theme"
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
  /** Hides the masthead (progress bar + phase label + time estimate) while
   *  keeping the step counted. Used by the language/theme picks, which read as
   *  pre-flow preferences rather than profile-building progress. */
  readonly hideMasthead?: boolean;
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
    hideMasthead: true,
    titleKey: "onboarding.flow.language.title",
  },
  {
    // Light/dark/system pick, right after language so its copy is already
    // translated. App-local (color-scheme store) — nothing goes to the
    // backend. Counted, but no masthead (reads as a preference, not progress).
    id: "theme",
    kind: "local",
    optional: false,
    hideMasthead: true,
    titleKey: "onboarding.flow.theme.title",
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
