import { bootstrap, exchangeSessionForTokens } from "@patch-careers/auth";
import type { Href } from "expo-router";
import { useCallback } from "react";
import { getCurrentAuthenticatedRoute } from "@/navigation/auth-redirect";
import { useAppRouter } from "@/navigation/use-app-router";

/**
 * Finishes a successful authentication: optionally exchanges a session
 * for tokens, runs `bootstrap()` (swallowing its errors so a degraded
 * profile fetch never blocks entry), then routes to the resolved
 * post-auth home. This is the sequence sign-in, 2fa-verify, verify-email
 * previously handled in several auth screens.
 */
export function useCompleteAuth(): {
  finishAuthentication: (opts?: {
    sessionExchangeId?: string;
    destination?: Href;
  }) => Promise<void>;
} {
  const router = useAppRouter();

  const finishAuthentication = useCallback(
    async (opts?: { sessionExchangeId?: string; destination?: Href }) => {
      if (opts?.sessionExchangeId) {
        await exchangeSessionForTokens(opts.sessionExchangeId);
      }
      await bootstrap().catch(() => undefined);
      router.replace(opts?.destination ?? getCurrentAuthenticatedRoute());
    },
    [router],
  );

  return { finishAuthentication };
}
