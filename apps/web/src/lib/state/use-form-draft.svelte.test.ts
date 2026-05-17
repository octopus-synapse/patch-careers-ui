import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearForUser, createSecureStorage } from '$lib/utils/secure-storage.svelte';
import { useFormDraft } from './use-form-draft.svelte';

type Profile = { name: string; email: string };

const cleanups: Array<() => void> = [];

function withRoot<T>(fn: () => T): T {
  let out!: T;
  const cleanup = $effect.root(() => {
    out = fn();
  });
  cleanups.push(cleanup);
  return out;
}

describe('useFormDraft (secure-storage backed)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
  });

  it('persists state with per-user namespaced key', async () => {
    const storage = createSecureStorage(() => 'user-a');
    const draft = withRoot(() =>
      useFormDraft<Profile>('profile', { name: '', email: '' }, { storage, debounceMs: 0 }),
    );

    draft.state.name = 'Alice';
    flushSync();

    await new Promise((r) => setTimeout(r, 5));

    expect(window.localStorage.getItem('secure:user-a:formDraft:profile')).toContain('Alice');
  });

  it('hydrates initial state from prior writes', () => {
    const storage = createSecureStorage(() => 'user-a');
    storage.set('formDraft:profile', { name: 'Bob' });

    const draft = withRoot(() =>
      useFormDraft<Profile>('profile', { name: '', email: '' }, { storage }),
    );

    expect(draft.state.name).toBe('Bob');
    expect(draft.state.email).toBe('');
  });

  it('clear wipes the entry and resets state to initial', () => {
    const storage = createSecureStorage(() => 'user-a');
    storage.set('formDraft:profile', { name: 'Bob', email: 'b@x' });

    const draft = withRoot(() =>
      useFormDraft<Profile>('profile', { name: '', email: '' }, { storage }),
    );
    draft.clear();

    expect(draft.state.name).toBe('');
    expect(window.localStorage.getItem('secure:user-a:formDraft:profile')).toBeNull();
  });

  it('clearForUser purges drafts on logout', () => {
    const storageA = createSecureStorage(() => 'user-a');
    const storageB = createSecureStorage(() => 'user-b');

    storageA.set('formDraft:profile', { name: 'Alice' });
    storageB.set('formDraft:profile', { name: 'Bob' });

    clearForUser('user-a');

    expect(storageA.get('formDraft:profile')).toBeUndefined();
    expect(storageB.get<Profile>('formDraft:profile')).toEqual({ name: 'Bob' });
  });

  it('isolates two users with same logical draft key', () => {
    const storageA = createSecureStorage(() => 'user-a');
    const storageB = createSecureStorage(() => 'user-b');

    storageA.set('formDraft:profile', { name: 'Alice' });

    const draftB = withRoot(() =>
      useFormDraft<Profile>('profile', { name: '', email: '' }, { storage: storageB }),
    );

    expect(draftB.state.name).toBe('');
  });
});
