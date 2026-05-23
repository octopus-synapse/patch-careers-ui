/**
 * Auth provider placeholder for PR #6.
 *
 * Real wiring (token bootstrap from secure store, refresh interceptor,
 * deep-link OAuth callback handling) lands in PR #7. For now we expose
 * a stable `{ user: null, isLoading: false }` shape so screens can be
 * written against the final API surface without `??`-everywhere.
 */

import { createContext, type ReactElement, type ReactNode, useContext, useMemo } from "react";

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface AuthContextValue {
  readonly user: AuthUser | null;
  readonly isLoading: boolean;
  readonly signIn: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}

const noop = async () => {
  /* placeholder until PR #7 wires real auth */
};

const defaultValue: AuthContextValue = {
  user: null,
  isLoading: false,
  signIn: noop,
  signOut: noop,
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const value = useMemo<AuthContextValue>(
    () => ({
      user: null,
      isLoading: false,
      signIn: noop,
      signOut: noop,
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
