import type { KeyValueStorage } from "@patch-careers/storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandJSONStorage } from "./persist";

export type ColorScheme = "light" | "dark" | "system";

export interface ColorSchemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
}

export const COLOR_SCHEME_STORE_VERSION = 1;
export const COLOR_SCHEME_STORE_KEY = "patch-careers:color-scheme";

const VALID: readonly ColorScheme[] = ["light", "dark", "system"] as const;

export function createColorSchemeStore(
  storage: KeyValueStorage,
  defaultScheme: ColorScheme = "system",
) {
  return create<ColorSchemeState>()(
    persist(
      (set) => ({
        scheme: defaultScheme,
        setScheme: (scheme) => set({ scheme }),
      }),
      {
        name: COLOR_SCHEME_STORE_KEY,
        storage: zustandJSONStorage(storage),
        version: COLOR_SCHEME_STORE_VERSION,
        migrate: (persisted, _version) => {
          if (
            persisted !== null &&
            typeof persisted === "object" &&
            "scheme" in persisted &&
            typeof (persisted as { scheme: unknown }).scheme === "string"
          ) {
            const candidate = (persisted as { scheme: string }).scheme as ColorScheme;
            if (VALID.includes(candidate)) {
              return { scheme: candidate, setScheme: () => undefined };
            }
          }
          return { scheme: defaultScheme, setScheme: () => undefined };
        },
      },
    ),
  );
}
