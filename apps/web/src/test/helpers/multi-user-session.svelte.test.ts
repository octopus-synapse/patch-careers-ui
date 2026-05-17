import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchMeDashboard: vi.fn(),
}));

vi.mock('api-client', () => ({
  getV1PagesMeDashboard: (...args: unknown[]) => mocks.fetchMeDashboard(...args),
  isApiError: () => false,
}));

import { createMeDashboardStore } from '$lib/state/me-dashboard.svelte';
import { useFormDraft } from '$lib/state/use-form-draft.svelte';
import { createSecureStorage } from '$lib/utils/secure-storage.svelte';
import { getMockUserId, withUserContext } from './multi-user-session.svelte';

describe('multi-user-session helper', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.fetchMeDashboard.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('exposes the user id to code running inside withUserContext', async () => {
    await withUserContext('user-a', async () => {
      expect(getMockUserId()).toBe('user-a');
    });
    expect(getMockUserId()).toBeUndefined();
  });

  it('me-dashboard stores are isolated across user contexts', async () => {
    mocks.fetchMeDashboard
      .mockResolvedValueOnce({ widgets: [{ id: 'wa' }] })
      .mockResolvedValueOnce({ widgets: [{ id: 'wb' }] });

    const dataA = await withUserContext('user-a', async () => {
      const store = createMeDashboardStore();
      await store.load();
      return store.data;
    });

    const dataB = await withUserContext('user-b', async () => {
      const store = createMeDashboardStore();
      expect(store.data).toBeNull();
      await store.load();
      return store.data;
    });

    expect(dataA).toEqual({ widgets: [{ id: 'wa' }] });
    expect(dataB).toEqual({ widgets: [{ id: 'wb' }] });
  });

  it('secureStorage isolates drafts across user contexts and wipes on exit', async () => {
    await withUserContext('user-a', () => {
      const storage = createSecureStorage(() => getMockUserId());
      storage.set('draft', { headline: 'Alice CV' });
      expect(window.localStorage.getItem('secure:user-a:draft')).toContain('Alice CV');
    });

    expect(window.localStorage.getItem('secure:user-a:draft')).toBeNull();

    await withUserContext('user-b', () => {
      const storage = createSecureStorage(() => getMockUserId());
      expect(storage.get('draft')).toBeUndefined();
    });
  });

  it('useFormDraft observed across two users sees independent drafts', async () => {
    await withUserContext('user-a', () => {
      const storage = createSecureStorage(() => getMockUserId());
      const draft = useFormDraft<{ name: string }>(
        'profile',
        { name: '' },
        { storage, debounceMs: 0 },
      );
      draft.state.name = 'Alice';
    });

    await withUserContext('user-b', () => {
      const storage = createSecureStorage(() => getMockUserId());
      const draft = useFormDraft<{ name: string }>('profile', { name: '' }, { storage });
      expect(draft.state.name).toBe('');
    });
  });
});
