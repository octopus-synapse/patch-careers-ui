/**
 * Universal key-value storage contract. Both mundane (analytics-ish,
 * non-sensitive) and secure (refresh tokens, OAuth state) implementations
 * conform to the same async surface — even when the underlying adapter
 * is synchronous (web localStorage, MMKV). Async-by-default keeps the
 * caller code platform-agnostic.
 *
 * Tier:
 *   - `mundane`: durable, plain. MMKV (mobile) / localStorage (web)
 *   - `secure`:  encrypted at rest. expo-secure-store (mobile) /
 *     sessionStorage (web — no true secure storage on the platform)
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string, options?: SetItemOptions): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

export interface SetItemOptions {
  /**
   * Mobile-only (expo-secure-store): require biometric / device-auth
   * unlock before storing. Ignored on web.
   */
  requireAuthentication?: boolean;
}
