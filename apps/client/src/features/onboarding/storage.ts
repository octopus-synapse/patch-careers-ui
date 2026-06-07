import { mundane } from "@patch-careers/storage";
import type { FormData, OnboardingSession, SectionItem } from "./types";

const SNAPSHOT_KEY = "onboarding:session-snapshot";
const DRAFT_PREFIX = "onboarding:draft:";
const PHONE_COUNTRY_KEY = "onboarding:phone-country";
const WELCOME_SEEN_KEY = "onboarding:welcome-seen";
const RESUME_DISMISSED_KEY = "onboarding:resume-dismissed";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type SnapshotPayload = {
  savedAt: number;
  session: OnboardingSession;
};

type DraftPayload = {
  savedAt: number;
  data: FormData;
  items: SectionItem[];
};

/**
 * Reads a TTL'd JSON payload: parses it, drops (and returns null) when it's
 * missing `savedAt` or older than `MAX_AGE_MS`. The guard `readSessionSnapshot`
 * and `readStepDraft` were each repeating.
 */
async function readFresh<T extends { savedAt: number }>(key: string): Promise<T | null> {
  const raw = await mundane.getItem(key).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<T> & { savedAt?: number };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      await mundane.removeItem(key).catch(() => undefined);
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/** A one-shot boolean flag (`"1"`/absent) persisted in `mundane`. */
function makeFlag(key: string) {
  return {
    async mark(): Promise<void> {
      await mundane.setItem(key, "1").catch(() => undefined);
    },
    async read(): Promise<boolean> {
      const raw = await mundane.getItem(key).catch(() => null);
      return raw === "1";
    },
    async clear(): Promise<void> {
      await mundane.removeItem(key).catch(() => undefined);
    },
  };
}

const welcomeSeenFlag = makeFlag(WELCOME_SEEN_KEY);
const resumeDismissedFlag = makeFlag(RESUME_DISMISSED_KEY);

export async function saveSessionSnapshot(session: OnboardingSession): Promise<void> {
  const payload: SnapshotPayload = { savedAt: Date.now(), session };
  await mundane.setItem(SNAPSHOT_KEY, JSON.stringify(payload)).catch(() => undefined);
}

export async function readSessionSnapshot(): Promise<OnboardingSession | null> {
  const parsed = await readFresh<SnapshotPayload>(SNAPSHOT_KEY);
  return parsed?.session ?? null;
}

export async function clearSessionSnapshot(): Promise<void> {
  await mundane.removeItem(SNAPSHOT_KEY).catch(() => undefined);
}

export async function saveStepDraft(
  stepId: string,
  data: FormData,
  items: SectionItem[],
): Promise<void> {
  const payload: DraftPayload = { savedAt: Date.now(), data, items };
  await mundane.setItem(`${DRAFT_PREFIX}${stepId}`, JSON.stringify(payload)).catch(() => undefined);
}

export async function readStepDraft(
  stepId: string,
): Promise<{ data: FormData; items: SectionItem[] } | null> {
  const parsed = await readFresh<DraftPayload>(`${DRAFT_PREFIX}${stepId}`);
  if (!parsed) return null;
  return { data: parsed.data ?? {}, items: parsed.items ?? [] };
}

export async function clearStepDraft(stepId: string): Promise<void> {
  await mundane.removeItem(`${DRAFT_PREFIX}${stepId}`).catch(() => undefined);
}

/** The phone country ISO survives across flow steps (location → personal) and
 *  reloads, so a choice made once isn't reset when navigating. */
export async function savePhoneCountry(iso: string): Promise<void> {
  await mundane.setItem(PHONE_COUNTRY_KEY, iso).catch(() => undefined);
}

export async function readPhoneCountry(): Promise<string | null> {
  return mundane.getItem(PHONE_COUNTRY_KEY).catch(() => null);
}

/** One-shot flag so the welcome intro shows once per device, not on every
 *  reload of an unstarted session. */
export const markWelcomeSeen = welcomeSeenFlag.mark;
export const readWelcomeSeen = welcomeSeenFlag.read;

/** Remember that the user dismissed the "continue where you left off" banner so
 *  it doesn't reappear on every reload. Cleared on complete / fresh restart. */
export const markResumeDismissed = resumeDismissedFlag.mark;
export const readResumeDismissed = resumeDismissedFlag.read;
export const clearResumeDismissed = resumeDismissedFlag.clear;
