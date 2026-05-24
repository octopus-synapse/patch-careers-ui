/**
 * Wires `@patch-careers/auth` into the Expo app:
 *
 *   - configures token storage (expo-secure-store via @patch-careers/storage
 *     mobileSecure adapter; web cookies via webSecure)
 *   - kicks `bootstrap()` once on mount and tracks the resulting hydrated
 *     auth state so route gates can react synchronously
 *   - installs the native OAuth launcher (`expo-auth-session/web-browser`)
 *     so `signInWithProviderNative` works
 *   - subscribes to `Linking` so the OAuth deep-link callback hits
 *     `completeOAuth()` and re-hydrates the store
 *
 * `useAuthBootstrap()` lets layouts wait for the first bootstrap before
 * rendering route content (avoids redirect flicker).
 */

import {
  bootstrap,
  completeOAuth,
  configureAuthClient,
  configureOAuthLauncher,
  type OAuthLauncher,
  selectIsAuthenticated,
  selectIsLoading,
  type TokenPair,
  useAuthStore,
} from "@patch-careers/auth";
import { mundane, secure } from "@patch-careers/storage";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

void WebBrowser.maybeCompleteAuthSession();

interface AuthBootstrapState {
  readonly hasBootstrapped: boolean;
  readonly apiBaseURL: string;
}

const AuthBootstrapContext = createContext<AuthBootstrapState>({
  hasBootstrapped: false,
  apiBaseURL: "",
});

function resolveApiBaseURL(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseURL?: string };
  return (
    extra.apiBaseURL ??
    (process.env["EXPO_PUBLIC_API_BASE_URL"] as string | undefined) ??
    "https://api.patchcareers.com"
  );
}

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const apiBaseURL = useMemo(resolveApiBaseURL, []);

  useEffect(() => {
    let cancelled = false;

    // One-time wiring. `secure` is a proxy that lazily picks expo-secure-store
    // on RN and a same-origin cookie store on web.
    configureAuthClient({ storage: secure, apiBaseURL });

    // OAuth launcher: opens the system browser tab (or in-app Custom Tabs
    // on Android) and waits for the deep-link callback. The auth helper
    // expects a `{ type, url }` result and uses the URL to extract the
    // accessToken / refreshToken pair the backend appended.
    const launcher: OAuthLauncher = async (authUrl, returnUrl) => {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl, {
        showInRecents: false,
      });
      if (result.type === "success" && "url" in result) {
        return { type: "success", url: (result as { url: string }).url };
      }
      if (result.type === "cancel") return { type: "cancel" };
      return { type: "dismiss" };
    };
    configureOAuthLauncher(launcher);

    void bootstrap()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHasBootstrapped(true);
      });

    // Universal deep-link subscription. The backend's OAuth callback
    // bounces back to `patchcareers://auth/callback?accessToken=...`;
    // when that URL arrives we forward to completeOAuth() and let it
    // persist the pair + re-hydrate the api-client headers.
    const sub = Linking.addEventListener("url", (event) => {
      if (!event.url) return;
      if (event.url.includes("/auth/callback") || event.url.includes("auth/callback")) {
        void completeOAuth(event.url, secure, apiBaseURL)
          .then(async (pair: TokenPair | null) => {
            if (pair) await bootstrap().catch(() => undefined);
          })
          .catch(() => undefined);
      }
    });

    // Touch `mundane` so the import isn't stripped — it'll be needed by
    // later PRs that persist non-secret preferences (theme, locale).
    void mundane;

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [apiBaseURL]);

  const value = useMemo<AuthBootstrapState>(
    () => ({ hasBootstrapped, apiBaseURL }),
    [hasBootstrapped, apiBaseURL],
  );

  return <AuthBootstrapContext.Provider value={value}>{children}</AuthBootstrapContext.Provider>;
}

export function useAuthBootstrap(): AuthBootstrapState {
  return useContext(AuthBootstrapContext);
}

/** Convenience hook — returns the observable auth state for route gates. */
export function useAuthState(): { isAuthenticated: boolean; isLoading: boolean } {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  return { isAuthenticated, isLoading };
}

/** Keep the legacy `useAuth()` shape so any callers from PR #6 don't break. */
export function useAuth(): {
  user: null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} {
  const { isLoading } = useAuthState();
  return {
    user: null,
    isLoading,
    signIn: async () => undefined,
    signOut: async () => undefined,
  };
}
