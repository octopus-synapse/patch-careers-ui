/**
 * Scoped draft store for the onboarding wizard (ADR-0004).
 *
 * The wizard draft — the accumulating `formData` + section `items` — is state
 * that is shared across a subtree (the wizard's steps) yet ephemeral: it lives
 * only while the flow is open and is thrown away on exit. That is the textbook
 * case for a *scoped* Zustand store rather than the global one: an instance is
 * created per wizard mount (see wizard-store-context) and discarded with it.
 *
 * `setFormData`/`setItems` intentionally mirror React's `useState` updater
 * signature (value OR `(prev) => next`) so call sites read identically whether
 * the draft is backed by `useState` or by this store. Persistence stays in
 * `../lib/storage` (the TTL sink); this store owns the in-memory draft.
 */
import { createStore } from "zustand/vanilla";
import type { FormData, SectionItem } from "../types";

export type WizardDraftState = {
  formData: FormData;
  items: SectionItem[];
};

export type WizardDraftActions = {
  /** Set `formData` from a value or an updater (mirrors useState). */
  setFormData: (next: FormData | ((prev: FormData) => FormData)) => void;
  /** Set `items` from a value or an updater (mirrors useState). */
  setItems: (next: SectionItem[] | ((prev: SectionItem[]) => SectionItem[])) => void;
  /** Replace the whole draft (used when (re)hydrating a backend step). */
  hydrate: (data: FormData, items: SectionItem[]) => void;
  /** Clear the draft back to empty. */
  reset: () => void;
};

export type WizardDraft = WizardDraftState & WizardDraftActions;

export type WizardStore = ReturnType<typeof createWizardStore>;

export function createWizardStore() {
  return createStore<WizardDraft>((set) => ({
    formData: {},
    items: [],
    setFormData: (next) =>
      set((s) => ({ formData: typeof next === "function" ? next(s.formData) : next })),
    setItems: (next) => set((s) => ({ items: typeof next === "function" ? next(s.items) : next })),
    hydrate: (data, items) => set({ formData: data, items }),
    reset: () => set({ formData: {}, items: [] }),
  }));
}
