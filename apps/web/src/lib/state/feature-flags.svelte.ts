import { createFeatureFlagsEvaluate, getFeatureFlagsEvaluateQueryKey } from 'api-client';
import { browser } from '$app/environment';

type UseFeatureFlagsOptions = {
  /** Gates the fetch — no point querying when the user isn't logged in. */
  authenticated: boolean;
};

/**
 * Reactive feature-flag snapshot for the current user. Flags are evaluated
 * server-side against the user's roles and the dependency DAG, so consumers
 * just need to ask `flags.enabled('resumes.export.pdf')`.
 */
export function useFeatureFlags(opts: () => UseFeatureFlagsOptions) {
  const query = createFeatureFlagsEvaluate(() => ({
    query: { enabled: browser && opts().authenticated, staleTime: 5 * 60 * 1000 },
  }));

  return {
    get isLoading(): boolean {
      return query.isLoading;
    },
    get flags(): Record<string, boolean> {
      const data = query.data as { flags?: Record<string, boolean> } | undefined;
      return data?.flags ?? {};
    },
    /**
     * Returns true when the flag is effectively ON. An unknown key returns
     * false — fail-closed so removing a flag from the registry also hides
     * any stale UI references to it.
     */
    enabled(key: string): boolean {
      return this.flags[key] === true;
    },
  };
}

export { getFeatureFlagsEvaluateQueryKey };
