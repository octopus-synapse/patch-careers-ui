import { beforeEach, describe, expect, it } from "vitest";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
  useAuthStore,
} from "./auth.store";
import type { User } from "./types";

const sampleUser: User = {
  userId: "u-1",
  email: "a@b.c",
  name: "Alice",
  username: "alice",
  emailVerified: true,
  isAdmin: false,
  hasCompletedOnboarding: true,
  needsEmailVerification: false,
};

beforeEach(() => {
  useAuthStore.getState().reset();
});

describe("auth.store", () => {
  it("starts unauthenticated", () => {
    const state = useAuthStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("setUser(non-null) flips isAuthenticated to true", () => {
    useAuthStore.getState().setUser(sampleUser);
    expect(useAuthStore.getState().currentUser).toEqual(sampleUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("setUser(null) flips isAuthenticated to false", () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("setLoading toggles isLoading without touching the user", () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    expect(useAuthStore.getState().currentUser).toEqual(sampleUser);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("reset() clears every slice", () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().reset();
    const s = useAuthStore.getState();
    expect(s.currentUser).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.isLoading).toBe(false);
  });

  it("selectors return the matching slice", () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().setLoading(true);
    const state = useAuthStore.getState();
    expect(selectCurrentUser(state)).toEqual(sampleUser);
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectIsLoading(state)).toBe(true);
  });
});
