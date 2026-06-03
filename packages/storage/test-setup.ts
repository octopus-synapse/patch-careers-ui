/**
 * Vitest setup for the web-storage tests.
 *
 * Node 26 ships an experimental `localStorage` global (gated behind
 * `--localstorage-file`) that resolves to `undefined`, and jsdom's own Web
 * Storage isn't reliably exposed under the Node 26 + jsdom 29 combo — so
 * `window.localStorage` comes back `undefined` and the browser-backed specs
 * blow up on `window.localStorage.clear()`.
 *
 * We install a deterministic in-memory Storage on both `window` and
 * `globalThis` (separate instances per slot, so localStorage and
 * sessionStorage stay isolated, matching real browser semantics). This only
 * affects the test environment — production `web.ts` is untouched and still
 * uses the real browser Storage at runtime.
 */

class MemoryStorage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function installStorage(name: "localStorage" | "sessionStorage"): void {
  const storage = new MemoryStorage();
  const targets = [globalThis, typeof window !== "undefined" ? window : undefined];
  for (const target of targets) {
    if (!target) continue;
    try {
      Object.defineProperty(target, name, {
        value: storage,
        configurable: true,
        writable: true,
      });
    } catch {
      try {
        (target as Record<string, unknown>)[name] = storage;
      } catch {
        // last resort: leave as-is; the spec will surface a clear failure.
      }
    }
  }
}

installStorage("localStorage");
installStorage("sessionStorage");
