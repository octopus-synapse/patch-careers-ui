import { z } from "zod";
import type { ExternalJob, JobsFilters } from "../types";

export type DiscoveryGroup = "recommended" | "similar" | "recent";
export type PreparationStage = "draft" | "ready" | "sent" | "interview";
export type Opportunity = Omit<ExternalJob, "companyDomain"> & {
  source?: "external" | "imported" | "internal" | undefined;
  companyDomain?: string | null;
  companyLogoUrl?: string | null | undefined;
  workModeKnown?: boolean | undefined;
};

export const DISCOVERY_GROUPS: readonly DiscoveryGroup[] = ["recommended", "similar", "recent"];
export const PREPARATION_STAGES: readonly PreparationStage[] = [
  "draft",
  "ready",
  "sent",
  "interview",
];
export const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function safeJobUrl(value: string | null | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function classifyJobInput(value: string): "url" | "description" | "invalid-url" | "short" {
  const text = value.trim();
  if (/^(?:[a-z][a-z\d+.-]*:\/\/|https?:|www\.)/i.test(text)) {
    return safeJobUrl(text.startsWith("www.") ? `https://${text}` : text) ? "url" : "invalid-url";
  }
  return text.length >= 50 ? "description" : "short";
}

export function matchesDiscoveryFilters(
  job: Opportunity,
  filters: JobsFilters,
  now: number,
): boolean {
  const text = normalize([job.title, job.company, job.description].filter(Boolean).join(" "));
  if (filters.search?.trim() && !text.includes(normalize(filters.search))) return false;
  if (
    filters.location?.trim() &&
    !normalize(job.location ?? "").includes(normalize(filters.location))
  )
    return false;
  if (
    filters.workModes.length &&
    (job.workModeKnown === false || !filters.workModes.includes(job.workMode))
  )
    return false;
  if (
    filters.employmentTypes.length &&
    (!job.employmentType || !filters.employmentTypes.includes(job.employmentType))
  )
    return false;
  if (filters.postedWithin) {
    const days = { TODAY: 1, LAST_3_DAYS: 3, LAST_WEEK: 7, LAST_MONTH: 30 }[filters.postedWithin];
    const posted = Date.parse(job.postedAt ?? job.fetchedAt);
    if (!Number.isFinite(posted) || posted < now - days * 86_400_000) return false;
  }
  return true;
}

// Similarity is deliberately based on role/skill terms, never company identity alone.
const STOP_WORDS = new Set(
  "de da do das dos para com uma um the a an and or of in at for to on e em junior pleno senior vaga vagas job jobs oportunidade opportunity remote remoto hibrido presencial full time emprego empresa company anos years experiencia experience trabalho work".split(
    " ",
  ),
);
export function jobTerms(job: Opportunity): Set<string> {
  return new Set(
    normalize(job.title)
      .split(/[^a-z\d+#.]+/)
      .filter((term) => term.length > 1 && !STOP_WORDS.has(term)),
  );
}

export function similarToSaved(
  catalog: readonly Opportunity[],
  saved: readonly Opportunity[],
): Opportunity[] {
  const savedIds = new Set(saved.map((job) => job.externalId));
  const terms = saved.map(jobTerms);
  return catalog
    .filter((job) => !job.isSaved && !savedIds.has(job.externalId))
    .map((job) => {
      const candidate = jobTerms(job);
      const overlap = Math.max(
        0,
        ...terms.map((reference) => [...candidate].filter((term) => reference.has(term)).length),
      );
      return { job, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.job.id.localeCompare(b.job.id))
    .map(({ job }) => job);
}

export function uniqueOpportunities(jobs: readonly Opportunity[]): Opportunity[] {
  return [...new Map(jobs.map((job) => [job.externalId, job])).values()];
}

export const opportunitySchema = z.object({
  id: z.string().min(1).max(200),
  externalId: z.string().min(1).max(300),
  title: z.string().max(500),
  company: z.string().max(300),
  location: z.string().nullable(),
  isRemote: z.boolean(),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  employmentType: z
    .enum(["INTERNSHIP", "CONTRACT", "FULL_TIME", "PART_TIME", "VOLUNTEER", "FREELANCE"])
    .nullable(),
  applyUrl: z.string().max(4000),
  publisher: z.string().nullable(),
  description: z.string().max(50000).nullable(),
  postedAt: z.string().nullable(),
  fetchedAt: z.string(),
  isSaved: z.boolean(),
  savedId: z.string().nullable(),
  source: z.enum(["external", "imported", "internal"]).optional(),
  companyDomain: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  companyLogoUrl: z.string().nullable().optional(),
  workModeKnown: z.boolean().optional(),
});

export const preparationDocumentSchema = z.object({
  kind: z.enum(["resume", "letter"]),
  resumeId: z.string(),
  versionId: z.string(),
  label: z.string().max(500),
  text: z.string().max(100000),
  createdAt: z.string(),
});
export type PreparationDocument = z.infer<typeof preparationDocumentSchema>;
export const workspaceEntrySchema = z.object({
  version: z.literal(1),
  job: opportunitySchema,
  viewedAt: z.string().nullable(),
  stage: z.enum(["draft", "ready", "sent", "interview"]).nullable(),
  documents: z.array(preparationDocumentSchema).max(20),
});
export type WorkspaceEntry = Omit<z.infer<typeof workspaceEntrySchema>, "job"> & {
  job: Opportunity;
};
export const WORKSPACE_PREFIX = "jobs.v2.entry.";
export const workspaceKey = (id: string): string => `${WORKSPACE_PREFIX}${id}`;
export function readWorkspace(state: Record<string, unknown>): WorkspaceEntry[] {
  return Object.entries(state)
    .filter(([key]) => key.startsWith(WORKSPACE_PREFIX))
    .flatMap(([, value]) => {
      const parsed = workspaceEntrySchema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    });
}
export function emptyEntry(job: Opportunity): WorkspaceEntry {
  return { version: 1, job, viewedAt: null, stage: null, documents: [] };
}
