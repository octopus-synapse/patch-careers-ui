/**
 * React glue for the scoped wizard draft store (see wizard-store.ts).
 *
 * `WizardStoreProvider` creates one store instance per mount (kept in a ref so
 * it survives re-renders) and discards it on unmount — the scoping that makes
 * the draft ephemeral. `useWizardStore(selector)` reads from it with a Zustand
 * selector, so a step component only re-renders when the slice it picks changes.
 */
import { createContext, type ReactElement, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import { createWizardStore, type WizardDraft, type WizardStore } from "./wizard-store";

const WizardStoreContext = createContext<WizardStore | null>(null);

export function WizardStoreProvider({ children }: { children: ReactNode }): ReactElement {
  const storeRef = useRef<WizardStore | null>(null);
  if (storeRef.current === null) storeRef.current = createWizardStore();
  return (
    <WizardStoreContext.Provider value={storeRef.current}>{children}</WizardStoreContext.Provider>
  );
}

export function useWizardStore<T>(selector: (state: WizardDraft) => T): T {
  const store = useContext(WizardStoreContext);
  if (store === null) {
    throw new Error("useWizardStore must be used within a WizardStoreProvider");
  }
  return useStore(store, selector);
}
