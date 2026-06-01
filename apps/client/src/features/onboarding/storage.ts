import { mundane } from "@patch-careers/storage";
import type { FormData, OnboardingSession, SectionItem } from "./types";

const SNAPSHOT_KEY = "onboarding:session-snapshot";
const DRAFT_PREFIX = "onboarding:draft:";
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
