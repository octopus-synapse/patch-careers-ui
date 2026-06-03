import type { KeyValueStorage } from "@patch-careers/storage";
import { createPersistedStore } from "./create-persisted-store";

/**
 * LGPD-aligned user consent (D45 area). Defaults are *deny-all* so the
 * app never starts collecting analytics/marketing before the user has
 * explicitly opted in.
 */
export interface ConsentFlags {
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentData {
  consent: ConsentFlags;
}
export interface ConsentActions {
  setConsent: (next: Partial<ConsentFlags>) => void;
  reset: () => void;
}
export type ConsentState = ConsentData & ConsentActions;

export const CONSENT_STORE_VERSION = 1;
export const CONSENT_STORE_KEY = "patch-careers:consent";

const DEFAULT_CONSENT: ConsentFlags = { analytics: false, marketing: false };

export function createConsentStore(storage: KeyValueStorage) {
  return createPersistedStore<ConsentData, ConsentActions>({
    key: CONSENT_STORE_KEY,
    version: CONSENT_STORE_VERSION,
    storage,
    initialData: { consent: DEFAULT_CONSENT },
    createActions: (set, get) => ({
      setConsent: (next) => set({ consent: { ...get().consent, ...next } }),
      reset: () => set({ consent: DEFAULT_CONSENT }),
    }),
    validate: (persisted) => {
      if (
        persisted !== null &&
        typeof persisted === "object" &&
        "consent" in persisted &&
        typeof (persisted as { consent: unknown }).consent === "object" &&
        (persisted as { consent: unknown }).consent !== null
      ) {
        const c = (persisted as { consent: Record<string, unknown> }).consent;
        return {
          consent: {
            analytics: typeof c.analytics === "boolean" ? c.analytics : false,
            marketing: typeof c.marketing === "boolean" ? c.marketing : false,
          },
        };
      }
      return null;
    },
  });
}
