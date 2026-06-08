/**
 * Persists the web "keep me signed in" checkbox choice so it's pre-filled
 * next time the sign-in screen opens. Web-only (cookie mode); on native the
 * checkbox isn't shown. Defaults to false on first visit per the product
 * decision (unchecked by default).
 */

import { mundane } from "@patch-careers/storage";

const KEY = "auth:keep-signed-in";

export async function readKeepSignedIn(): Promise<boolean> {
  const raw = await mundane.getItem(KEY).catch(() => null);
  return raw === "1";
}

export async function saveKeepSignedIn(value: boolean): Promise<void> {
  await mundane.setItem(KEY, value ? "1" : "0").catch(() => undefined);
}
