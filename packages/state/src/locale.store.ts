import type { KeyValueStorage } from "@patch-careers/storage";
import { createPersistedStore } from "./create-persisted-store";

export type Locale = "pt-BR" | "en";

export interface LocaleData {
  locale: Locale;
}
export interface LocaleActions {
  setLocale: (locale: Locale) => void;
}
export type LocaleState = LocaleData & LocaleActions;

export const LOCALE_STORE_VERSION = 1;
export const LOCALE_STORE_KEY = "patch-careers:locale";

export function createLocaleStore(storage: KeyValueStorage, defaultLocale: Locale = "pt-BR") {
  return createPersistedStore<LocaleData, LocaleActions>({
    key: LOCALE_STORE_KEY,
    version: LOCALE_STORE_VERSION,
    storage,
    initialData: { locale: defaultLocale },
    createActions: (set) => ({
      setLocale: (locale) => set({ locale }),
    }),
    validate: (persisted) => {
      if (
        persisted !== null &&
        typeof persisted === "object" &&
        "locale" in persisted &&
        typeof (persisted as { locale: unknown }).locale === "string"
      ) {
        const candidate = (persisted as { locale: string }).locale;
        if (candidate === "pt-BR" || candidate === "en") return { locale: candidate };
      }
      return null;
    },
  });
}
