import type { TranslationDict } from "../types";

/**
 * Placeholder en dictionary. PR #5 (api-client) ships a typed
 * generated dictionary that supersedes this file.
 */
export const en: TranslationDict = {
  common: {
    hello: "Hello",
    loading: "Loading…",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    retry: "Try again",
    welcome: "Welcome, {name}!",
  },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
  },
};

export default en;
