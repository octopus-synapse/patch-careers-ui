/**
 * The demos' numeric and structural data — everything about Camila that is
 * NOT copy. Strings live in the `landing.demo.*` / `landing.scores.*` /
 * `landing.night.*` i18n groups; this file holds the numbers, orderings and
 * timings the prototype defined, so the components stay declarative.
 */

/** The three jobs the chips switch between. */
export type DemoJobKey = "vendas" | "atend" | "mkt";

/** Skill pill ids, mapping to `landing.demo.skills.s*`. */
export type SkillKey = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7";

/** Experience ids, mapping to `landing.demo.experience.*`. */
export type ExperienceKey = "loja" | "call" | "estoque";

export interface DemoJob {
  readonly match: number;
  /** Pills promoted to the top, in the order the job wants them. */
  readonly top: readonly SkillKey[];
  /** Experiences dimmed for this job. */
  readonly hidden: readonly ExperienceKey[];
}

export const DEMO_JOBS: Record<DemoJobKey, DemoJob> = {
  vendas: { match: 89, top: ["s2", "s3", "s1"], hidden: [] },
  atend: { match: 84, top: ["s1", "s5", "s4"], hidden: ["estoque"] },
  mkt: { match: 76, top: ["s6", "s7", "s5"], hidden: ["estoque"] },
};

export const ALL_SKILLS: readonly SkillKey[] = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];
export const ALL_EXPERIENCES: readonly ExperienceKey[] = ["loja", "call", "estoque"];

/** Pills in job order: the promoted ones first, then the rest as authored. */
export function orderedSkills(job: DemoJobKey): readonly SkillKey[] {
  const { top } = DEMO_JOBS[job];
  return [...top, ...ALL_SKILLS.filter((skill) => !top.includes(skill))];
}

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

export interface DemoSubScore {
  readonly key: "content" | "completeness" | "keywords" | "requirements" | "context" | "culture";
  readonly value: number;
  readonly gain?: number;
  readonly locked?: boolean;
}

export interface DemoScore {
  readonly key: "style" | "quality" | "match";
  readonly value: number;
  readonly gain: number;
  readonly sub?: readonly DemoSubScore[];
}

export const DEMO_SCORES: readonly DemoScore[] = [
  { key: "style", value: 82, gain: 13 },
  {
    key: "quality",
    value: 74,
    gain: 12,
    sub: [
      { key: "content", value: 68, gain: 12 },
      { key: "completeness", value: 83, gain: 9 },
    ],
  },
  {
    key: "match",
    value: 89,
    gain: 6,
    sub: [
      { key: "keywords", value: 92, gain: 4 },
      { key: "requirements", value: 78, gain: 5 },
      { key: "context", value: 90, gain: 3 },
      { key: "culture", value: 84, locked: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* The night                                                           */
/* ------------------------------------------------------------------ */

export interface NightRow {
  readonly key: "r1" | "r2" | "r3" | "r4" | "r5" | "r6";
  /** Clock time the application lands, minutes after 23:00. */
  readonly minute: number;
  readonly clock: string;
  readonly match: number;
  /** The one that "opened at 3 a.m." — the chapter's headline made visible. */
  readonly openedAtThree?: boolean;
}

export const NIGHT_ROWS: readonly NightRow[] = [
  { key: "r1", minute: 41, clock: "23:41", match: 91 },
  { key: "r2", minute: 135, clock: "01:15", match: 84 },
  { key: "r3", minute: 210, clock: "02:30", match: 52 },
  { key: "r4", minute: 252, clock: "03:12", match: 83, openedAtThree: true },
  { key: "r5", minute: 340, clock: "04:40", match: 76 },
  { key: "r6", minute: 440, clock: "06:20", match: 80 },
];

/** The whole night, 23:00 → 07:00, compressed into this many milliseconds. */
export const NIGHT_DURATION_MS = 6500;
export const NIGHT_TOTAL_MINUTES = 8 * 60;
/** Below this fit, the robot doesn't apply. */
export const AUTO_APPLY_THRESHOLD = 80;
