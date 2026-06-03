/**
 * Universal storage entrypoint.
 *
 * Re-exports the typed interface plus both platform adapters. The
 * `mundane` / `secure` named exports auto-dispatch to web or mobile
 * based on `navigator.product`, but they are *thin proxies* — they
 * only resolve the underlying adapter on first call, so neither
 * `react-native-mmkv` nor `expo-secure-store` is touched until a
 * method actually runs on a native runtime. Web bundlers can tree-
 * shake the mobile adapter when the proxies are never invoked.
 *
 * Apps that need stricter platform-only bundles can import the named
 * `webMundane` / `mobileMundane` etc. directly.
 */
import { isWebRuntime } from "@patch-careers/platform";
import type { KeyValueStorage, SetItemOptions } from "./interface";
import { webMundane, webSecure } from "./web";

export type { KeyValueStorage, SetItemOptions } from "./interface";
export { createWebStorage, webMundane, webSecure } from "./web";

async function loadMobileAdapter(slot: "mobileMundane" | "mobileSecure"): Promise<KeyValueStorage> {
  const mod = (await import("./mobile")) as typeof import("./mobile");
  return mod[slot];
}

function createProxy(
  slot: "mobileMundane" | "mobileSecure",
  webFallback: KeyValueStorage,
): KeyValueStorage {
  let resolved: KeyValueStorage | null = null;
  async function resolve(): Promise<KeyValueStorage> {
    if (resolved !== null) return resolved;
    resolved = isWebRuntime() ? webFallback : await loadMobileAdapter(slot);
    return resolved;
  }
  return {
    async getItem(key) {
      const adapter = await resolve();
      return adapter.getItem(key);
    },
    async setItem(key, value, options?: SetItemOptions) {
      const adapter = await resolve();
      return adapter.setItem(key, value, options);
    },
    async removeItem(key) {
      const adapter = await resolve();
      return adapter.removeItem(key);
    },
    async clear() {
      const adapter = await resolve();
      return adapter.clear();
    },
    async getAllKeys() {
      const adapter = await resolve();
      return adapter.getAllKeys();
    },
  };
}

export const mundane: KeyValueStorage = createProxy("mobileMundane", webMundane);
export const secure: KeyValueStorage = createProxy("mobileSecure", webSecure);
