/**
 * Storage key for the persisted UI locale.
 *
 * `I18nProvider` (apps/client) writes the bare locale tag under this key and
 * reads it back with `isLocale()`. A zustand store used to be declared on the
 * same key with a versioned JSON envelope — never instantiated, so harmless,
 * but the first caller to wire it up would have corrupted the provider's
 * value. It was removed; the key alone is what the app needs.
 */
export const LOCALE_STORE_KEY = "patch-careers:locale";
