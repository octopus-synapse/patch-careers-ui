import type { KeyValueStorage } from "@patch-careers/storage";
import { createPersistedStore } from "./create-persisted-store";

export type ColorScheme = "light" | "dark" | "system";

export interface ColorSchemeData {
  scheme: ColorScheme;
}
export interface ColorSchemeActions {
  setScheme: (scheme: ColorScheme) => void;
}
export type ColorSchemeState = ColorSchemeData & ColorSchemeActions;

export const COLOR_SCHEME_STORE_VERSION = 1;
export const COLOR_SCHEME_STORE_KEY = "patch-careers:color-scheme";

const VALID: readonly ColorScheme[] = ["light", "dark", "system"] as const;

export function createColorSchemeStore(
  storage: KeyValueStorage,
  defaultScheme: ColorScheme = "system",
) {
  return createPersistedStore<ColorSchemeData, ColorSchemeActions>({
    key: COLOR_SCHEME_STORE_KEY,
    version: COLOR_SCHEME_STORE_VERSION,
    storage,
    initialData: { scheme: defaultScheme },
    createActions: (set) => ({
      setScheme: (scheme) => set({ scheme }),
    }),
    validate: (persisted) => {
      if (
        persisted !== null &&
        typeof persisted === "object" &&
        "scheme" in persisted &&
        typeof (persisted as { scheme: unknown }).scheme === "string"
      ) {
        const candidate = (persisted as { scheme: string }).scheme as ColorScheme;
        if (VALID.includes(candidate)) return { scheme: candidate };
      }
      return null;
    },
  });
}
