import type { KeyValueStorage } from "@patch-careers/storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandJSONStorage } from "./persist";

export type Locale = "pt-BR" | "en";

export interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LOCALE_STORE_VERSION = 1;
export const LOCALE_STORE_KEY = "patch-careers:locale";

export function createLocaleStore(storage: KeyValueStorage, defaultLocale: Locale = "pt-BR") {
  return create<LocaleState>()(
    persist(
      (set) => ({
        locale: defaultLocale,
        setLocale: (locale) => set({ locale }),
      }),
      {
        name: LOCALE_STORE_KEY,
        storage: zustandJSONStorage(storage),
        version: LOCALE_STORE_VERSION,
        migrate: (persisted, _version) => {
          if (
            persisted !== null &&
            typeof persisted === "object" &&
            "locale" in persisted &&
            typeof (persisted as { locale: unknown }).locale === "string"
          ) {
            const candidate = (persisted as { locale: string }).locale;
            if (candidate === "pt-BR" || candidate === "en") {
              return { locale: candidate, setLocale: () => undefined };
            }
          }
          return { locale: defaultLocale, setLocale: () => undefined };
        },
      },
    ),
  );
}
