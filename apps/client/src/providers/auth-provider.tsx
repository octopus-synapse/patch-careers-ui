/**
 * Wires `@patch-careers/auth` into the Expo app:
 *
 *   - configures token storage (expo-secure-store via @patch-careers/storage
 *     mobileSecure adapter; web cookies via webSecure)
 *   - kicks `bootstrap()` once on mount and tracks the resulting hydrated
 *     auth state so route gates can react synchronously
 *
 * `useAuthBootstrap()` lets layouts wait for the first bootstrap before
 * rendering route content (avoids redirect flicker).
 */

import {
  bootstrap,
  configureAuthClient,
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
  type User,
  useAuthStore,
} from "@patch-careers/auth";
import { mundane, secure } from "@patch-careers/storage";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { resolveApiBaseURL } from "@/config/api";

interface AuthBootstrapState {
  readonly hasBootstrapped: boolean;
  readonly apiBaseURL: string;
}

const AuthBootstrapContext = createContext<AuthBootstrapState>({
  hasBootstrapped: false,
  apiBaseURL: "",
});

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const apiBaseURL = useMemo(resolveApiBaseURL, []);

  useEffect(() => {
    let cancelled = false;

    // One-time wiring. `secure` is a proxy that lazily picks expo-secure-store
    // on RN and a same-origin cookie store on web. Web uses httpOnly cookie
    // mode (no JS token; `/refresh` rolls the cookie) while native keeps the
    // Bearer + secure-store flow.
    configureAuthClient({
      storage: secure,
      apiBaseURL,
      preferTokens: Platform.OS !== "web",
    });

    void bootstrap()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHasBootstrapped(true);
      });

    // Touch `mundane` so the import isn't stripped — it'll be needed by
    // later PRs that persist non-secret preferences (theme, locale).
    void mundane;

    return () => {
      cancelled = true;
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
export function useAuthState(): {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const currentUser = useAuthStore(selectCurrentUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  return { currentUser, isAuthenticated, isLoading };
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
