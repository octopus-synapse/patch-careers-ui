/**
 * `useOverlayPresence` — is an overlay currently covering the landing?
 *
 * The overlays are rendered outside this feature (the navbar owns the auth
 * dialog, RN `Modal` portals the consent dialog to the end of the body), so
 * there is no prop to thread down. They all leave the same DOM marker the
 * deck's input guard already reads, and a `MutationObserver` on the body turns
 * that into state — mount and unmount both land in one place, whoever opened it.
 *
 * Web-only, like everything the marker describes: on native the hook is a
 * constant `false` and no observer is ever created.
 */

import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { isOverlayOpen } from "../lib/landing-overlay";

export function useOverlayPresence(): boolean {
  const [present, setPresent] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const sync = (): void => setPresent(isOverlayOpen());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return present;
}
