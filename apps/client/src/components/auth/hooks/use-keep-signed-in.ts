import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";

/**
 * Web-only "keep me signed in" (cookie mode): restores the user's last
 * choice on mount and persists every toggle. Native auth is token-based on
 * secure storage, so the box never shows there (`enabled` is false).
 */
export function useKeepSignedIn(): {
  enabled: boolean;
  keepSignedIn: boolean;
  toggle: () => void;
} {
  const enabled = Platform.OS === "web";
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    void readKeepSignedIn().then(setKeepSignedIn);
  }, [enabled]);

  const toggle = useCallback(() => {
    setKeepSignedIn((v) => {
      const next = !v;
      void saveKeepSignedIn(next);
      return next;
    });
  }, []);

  return { enabled, keepSignedIn, toggle };
}
