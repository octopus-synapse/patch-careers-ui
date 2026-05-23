import { describe, expect, it } from "vitest";
import { CONSENT_STORE_KEY, CONSENT_STORE_VERSION, createConsentStore } from "./consent.store";
import { createMemoryStorage, flushAsync } from "./test-helpers";

describe("createConsentStore", () => {
  it("defaults to deny-all (LGPD-safe)", () => {
    const useStore = createConsentStore(createMemoryStorage());
    expect(useStore.getState().consent).toEqual({ analytics: false, marketing: false });
  });

  it("setConsent applies a partial update", () => {
    const useStore = createConsentStore(createMemoryStorage());
    useStore.getState().setConsent({ analytics: true });
    expect(useStore.getState().consent).toEqual({ analytics: true, marketing: false });
  });

  it("reset returns to defaults", () => {
    const useStore = createConsentStore(createMemoryStorage());
    useStore.getState().setConsent({ analytics: true, marketing: true });
    useStore.getState().reset();
    expect(useStore.getState().consent).toEqual({ analytics: false, marketing: false });
  });

  it("persists consent flags", async () => {
    const storage = createMemoryStorage();
    const useStore = createConsentStore(storage);
    useStore.getState().setConsent({ marketing: true });
    await flushAsync(5);
    const raw = await storage.getItem(CONSENT_STORE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}") as {
      state: { consent: { analytics: boolean; marketing: boolean } };
      version: number;
    };
    expect(parsed.state.consent).toEqual({ analytics: false, marketing: true });
    expect(parsed.version).toBe(CONSENT_STORE_VERSION);
  });

  it("rehydrates from a stored payload", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(
      CONSENT_STORE_KEY,
      JSON.stringify({
        state: { consent: { analytics: true, marketing: false } },
        version: CONSENT_STORE_VERSION,
      }),
    );
    const useStore = createConsentStore(storage);
    await flushAsync(5);
    expect(useStore.getState().consent.analytics).toBe(true);
  });

  it("coerces malformed flag types to false", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(
      CONSENT_STORE_KEY,
      JSON.stringify({
        state: { consent: { analytics: "yes", marketing: 1 } },
        version: 0,
      }),
    );
    const useStore = createConsentStore(storage);
    await flushAsync(5);
    expect(useStore.getState().consent).toEqual({ analytics: false, marketing: false });
  });
});
