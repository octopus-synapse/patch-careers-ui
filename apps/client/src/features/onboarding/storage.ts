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

export async function saveSessionSnapshot(session: OnboardingSession): Promise<void> {
  const payload: SnapshotPayload = { savedAt: Date.now(), session };
  await mundane.setItem(SNAPSHOT_KEY, JSON.stringify(payload)).catch(() => undefined);
}

export async function readSessionSnapshot(): Promise<OnboardingSession | null> {
  const raw = await mundane.getItem(SNAPSHOT_KEY).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SnapshotPayload>;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      await mundane.removeItem(SNAPSHOT_KEY).catch(() => undefined);
      return null;
    }
    return parsed.session ?? null;
  } catch {
    return null;
  }
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
  const raw = await mundane.getItem(`${DRAFT_PREFIX}${stepId}`).catch(() => null);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DraftPayload>;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      await clearStepDraft(stepId);
      return null;
    }
    return { data: parsed.data ?? {}, items: parsed.items ?? [] };
  } catch {
    return null;
  }
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
export async function markWelcomeSeen(): Promise<void> {
  await mundane.setItem(WELCOME_SEEN_KEY, "1").catch(() => undefined);
}

export async function readWelcomeSeen(): Promise<boolean> {
  const raw = await mundane.getItem(WELCOME_SEEN_KEY).catch(() => null);
  return raw === "1";
}

/** Remember that the user dismissed the "continue where you left off" banner so
 *  it doesn't reappear on every reload. Cleared on complete / fresh restart. */
export async function markResumeDismissed(): Promise<void> {
  await mundane.setItem(RESUME_DISMISSED_KEY, "1").catch(() => undefined);
}

export async function readResumeDismissed(): Promise<boolean> {
  const raw = await mundane.getItem(RESUME_DISMISSED_KEY).catch(() => null);
  return raw === "1";
}

export async function clearResumeDismissed(): Promise<void> {
  await mundane.removeItem(RESUME_DISMISSED_KEY).catch(() => undefined);
}
