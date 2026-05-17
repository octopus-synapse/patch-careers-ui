import { describe, expect, it, vi } from 'vitest';

vi.mock('api-client', () => ({
  getV1PagesMeDashboard: vi.fn().mockResolvedValue({ widgets: [{ id: 'w1' }] }),
  isApiError: () => false,
}));

import { createMeDashboardStore } from './me-dashboard.svelte';

describe('createMeDashboardStore', () => {
  it('creates independent stores with isolated state', async () => {
    const storeA = createMeDashboardStore();
    const storeB = createMeDashboardStore();

    expect(storeA).not.toBe(storeB);

    await storeA.load();
    expect(storeA.data).not.toBeNull();
    expect(storeB.data).toBeNull();
  });

  it('invalidate on one store does not affect another', async () => {
    const storeA = createMeDashboardStore();
    const storeB = createMeDashboardStore();

    await storeA.load();
    await storeB.load();

    storeA.invalidate();
    expect(storeA.data).toBeNull();
    expect(storeB.data).not.toBeNull();
  });

  it('exposes widgets accessor reading from cached payload', async () => {
    const store = createMeDashboardStore();
    expect(store.widgets).toEqual([]);
    await store.load();
    expect(store.widgets).toEqual([{ id: 'w1' }]);
  });
});
