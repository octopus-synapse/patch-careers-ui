/**
 * Which language VERSION each résumé is being viewed in — the override the
 * language switch sets (ADR-0011). Global, not persisted: the profile tab,
 * its section screens and the résumé detail all read the same choice, and a
 * fresh launch goes back to the résumé's own language. (ADR-0004: shared
 * ephemeral state → Zustand; persistence is not wanted here.)
 */
import type { Locale } from "@patch-careers/i18n";
import { create } from "zustand";

interface ContentLocaleStore {
  readonly overrides: Readonly<Record<string, Locale>>;
  readonly setOverride: (resumeId: string, locale: Locale) => void;
}

export const useContentLocaleStore = create<ContentLocaleStore>((set) => ({
  overrides: {},
  setOverride: (resumeId, locale) =>
    set((state) => ({ overrides: { ...state.overrides, [resumeId]: locale } })),
}));
