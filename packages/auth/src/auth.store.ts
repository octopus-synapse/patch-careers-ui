/**
 * Zustand store for the current authenticated user.
 *
 * Intentionally NOT persisted (no `zustand/middleware/persist`): tokens
 * are the source of truth and already live in `tokenStorage`. The user
 * object is re-hydrated on app boot via `bootstrap()` which validates
 * the stored access token against `/v1/auth/session` and resolves the
 * fresh server-side user record. Persisting it locally would risk stale
 * profile data after off-app changes (admin role flip, email change).
 */
import { create } from "zustand";
import type { User } from "./types";

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ currentUser: user, isAuthenticated: user !== null }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ currentUser: null, isAuthenticated: false, isLoading: false }),
}));

/** Selector helpers — kept exported so React components import the
 * minimal slice they read (Zustand only re-renders the consumer when
 * the selected slice changes). */
export const selectCurrentUser = (state: AuthState): User | null => state.currentUser;
export const selectIsAuthenticated = (state: AuthState): boolean => state.isAuthenticated;
export const selectIsLoading = (state: AuthState): boolean => state.isLoading;
