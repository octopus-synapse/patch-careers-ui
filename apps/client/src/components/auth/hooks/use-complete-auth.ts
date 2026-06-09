import { bootstrap, exchangeSessionForTokens } from "@patch-careers/auth";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { getCurrentAuthenticatedRoute } from "@/navigation/auth-redirect";

/**
 * Finishes a successful authentication: optionally exchanges a session
 * for tokens, runs `bootstrap()` (swallowing its errors so a degraded
 * profile fetch never blocks entry), then routes to the resolved
 * post-auth home. This is the sequence sign-in, 2fa-verify, verify-email
 * and oauth-callback were each hand-rolling.
 */
export function useCompleteAuth(): {
  finishAuthentication: (opts?: { sessionExchangeId?: string }) => Promise<void>;
} {
  const router = useRouter();

  const finishAuthentication = useCallback(
    async (opts?: { sessionExchangeId?: string }) => {
      if (opts?.sessionExchangeId) {
        await exchangeSessionForTokens(opts.sessionExchangeId);
      }
      await bootstrap().catch(() => undefined);
      router.replace(getCurrentAuthenticatedRoute());
    },
    [router],
  );

  return { finishAuthentication };
}
