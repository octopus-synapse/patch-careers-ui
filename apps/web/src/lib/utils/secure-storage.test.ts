import { beforeEach, describe, expect, it } from 'vitest';
import { clearForUser, createSecureStorage } from './secure-storage.svelte';

describe('secureStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('namespaces keys by current user id', () => {
    const storeA = createSecureStorage(() => 'user-a');
    storeA.set('draft', { title: 'hello' });

    expect(window.localStorage.getItem('secure:user-a:draft')).toBe('{"title":"hello"}');
    expect(storeA.get<{ title: string }>('draft')).toEqual({ title: 'hello' });
  });

  it('isolates reads across users with same logical key', () => {
    const storeA = createSecureStorage(() => 'user-a');
    const storeB = createSecureStorage(() => 'user-b');

    storeA.set('draft', 'A');
    storeB.set('draft', 'B');

    expect(storeA.get<string>('draft')).toBe('A');
    expect(storeB.get<string>('draft')).toBe('B');
  });

  it('clearForCurrentUser removes only entries belonging to that user', () => {
    const storeA = createSecureStorage(() => 'user-a');
    const storeB = createSecureStorage(() => 'user-b');

    storeA.set('draft1', 'x');
    storeA.set('draft2', 'y');
    storeB.set('draft1', 'z');

    storeA.clearForCurrentUser();

    expect(storeA.get('draft1')).toBeUndefined();
    expect(storeA.get('draft2')).toBeUndefined();
    expect(storeB.get<string>('draft1')).toBe('z');
  });

  it('clearForUser purges entries by explicit user id', () => {
    const storeA = createSecureStorage(() => 'user-a');
    const storeB = createSecureStorage(() => 'user-b');

    storeA.set('k', 1);
    storeB.set('k', 2);

    clearForUser('user-a');

    expect(storeA.get('k')).toBeUndefined();
    expect(storeB.get<number>('k')).toBe(2);
  });

  it('uses anon namespace when user id is undefined', () => {
    const storeAnon = createSecureStorage(() => undefined);
    storeAnon.set('k', 'v');
    expect(window.localStorage.getItem('secure:anon:k')).toBe('"v"');
  });

  it('remove deletes a single entry', () => {
    const storeA = createSecureStorage(() => 'user-a');
    storeA.set('keep', 1);
    storeA.set('drop', 2);

    storeA.remove('drop');

    expect(storeA.get<number>('keep')).toBe(1);
    expect(storeA.get('drop')).toBeUndefined();
  });
});
