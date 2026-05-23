import type { KeyValueStorage } from "@patch-careers/storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandJSONStorage } from "./persist";

/**
 * LGPD-aligned user consent (D45 area). Defaults are *deny-all* so the
 * app never starts collecting analytics/marketing before the user has
 * explicitly opted in.
 */
export interface ConsentFlags {
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState {
  consent: ConsentFlags;
  setConsent: (next: Partial<ConsentFlags>) => void;
  reset: () => void;
}

export const CONSENT_STORE_VERSION = 1;
export const CONSENT_STORE_KEY = "patch-careers:consent";

const DEFAULT_CONSENT: ConsentFlags = { analytics: false, marketing: false };

export function createConsentStore(storage: KeyValueStorage) {
  return create<ConsentState>()(
    persist(
      (set, get) => ({
        consent: DEFAULT_CONSENT,
        setConsent: (next) => set({ consent: { ...get().consent, ...next } }),
        reset: () => set({ consent: DEFAULT_CONSENT }),
      }),
      {
        name: CONSENT_STORE_KEY,
        storage: zustandJSONStorage(storage),
        version: CONSENT_STORE_VERSION,
        migrate: (persisted, _version) => {
          const fallback: ConsentState = {
            consent: DEFAULT_CONSENT,
            setConsent: () => undefined,
            reset: () => undefined,
          };
          if (
            persisted !== null &&
            typeof persisted === "object" &&
            "consent" in persisted &&
            typeof (persisted as { consent: unknown }).consent === "object" &&
            (persisted as { consent: unknown }).consent !== null
          ) {
            const c = (persisted as { consent: Record<string, unknown> }).consent;
            return {
              ...fallback,
              consent: {
                analytics: typeof c.analytics === "boolean" ? c.analytics : false,
                marketing: typeof c.marketing === "boolean" ? c.marketing : false,
              },
            };
          }
          return fallback;
        },
      },
    ),
  );
}
