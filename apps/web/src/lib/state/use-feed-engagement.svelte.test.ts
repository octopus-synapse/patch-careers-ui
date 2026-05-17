import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  postBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
  invalidateQueries: vi.fn(),
  toastShow: vi.fn(),
}));
const { postBookmark, deleteBookmark, invalidateQueries, toastShow } = mocks;

vi.mock('@tanstack/svelte-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('api-client', () => ({
  deleteV1PostsId: vi.fn(),
  deleteV1PostsIdBookmark: (id: string) => mocks.deleteBookmark(id),
  deleteV1PostsIdLike: vi.fn(),
  getV1FeedQueryKey: () => ['feed'],
  postV1PostsIdBookmark: (id: string) => mocks.postBookmark(id),
  postV1PostsIdLike: vi.fn(),
  postV1PostsIdPollVote: vi.fn(),
  postV1PostsIdReport: vi.fn(),
  postV1PostsIdRepost: vi.fn(),
}));

vi.mock('ui', () => ({
  toastState: { show: mocks.toastShow },
}));

vi.mock('$lib/components/errors/error-renderer.svelte', () => ({
  handleApiError: vi.fn(),
}));

vi.mock('$lib/state/locale.svelte', () => ({
  locale: { t: (k: string) => k },
}));

vi.mock('$lib/utils/analytics/track', () => ({ track: vi.fn() }));

vi.mock('$lib/utils/undoable-action', () => ({ undoableAction: vi.fn() }));

import { useFeedEngagement } from './use-feed-engagement.svelte';

type Post = Record<string, unknown>;

const cleanups: Array<() => void> = [];

function withRoot<T>(fn: () => T): T {
  let out!: T;
  const cleanup = $effect.root(() => {
    out = fn();
  });
  cleanups.push(cleanup);
  return out;
}

describe('useFeedEngagement.handleBookmark / handleUnbookmark', () => {
  let posts: Post[];

  beforeEach(() => {
    posts = [{ id: '1', isBookmarked: false }];
    postBookmark.mockReset();
    deleteBookmark.mockReset();
    invalidateQueries.mockReset();
    toastShow.mockReset();
  });

  afterEach(() => {
    while (cleanups.length) cleanups.pop()?.();
  });

  it('handleBookmark applies optimistic update and invalidates on success', async () => {
    postBookmark.mockResolvedValue(undefined);
    const hook = withRoot(() =>
      useFeedEngagement({
        getPosts: () => posts,
        setPosts: (next) => {
          posts = next;
        },
      }),
    );

    await hook.handleBookmark('1');

    expect(posts[0]?.isBookmarked).toBe(true);
    expect(postBookmark).toHaveBeenCalledWith('1');
    expect(invalidateQueries).toHaveBeenCalled();
    expect(toastShow).not.toHaveBeenCalled();
  });

  it('handleBookmark reverts optimistic state and toasts on SDK failure', async () => {
    postBookmark.mockRejectedValue(new Error('network'));
    const hook = withRoot(() =>
      useFeedEngagement({
        getPosts: () => posts,
        setPosts: (next) => {
          posts = next;
        },
      }),
    );

    await hook.handleBookmark('1');

    expect(posts[0]?.isBookmarked).toBe(false);
    expect(toastShow).toHaveBeenCalledWith('errors.network', 'danger');
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('handleUnbookmark applies optimistic update and invalidates on success', async () => {
    posts = [{ id: '1', isBookmarked: true }];
    deleteBookmark.mockResolvedValue(undefined);
    const hook = withRoot(() =>
      useFeedEngagement({
        getPosts: () => posts,
        setPosts: (next) => {
          posts = next;
        },
      }),
    );

    await hook.handleUnbookmark('1');

    expect(posts[0]?.isBookmarked).toBe(false);
    expect(deleteBookmark).toHaveBeenCalledWith('1');
    expect(invalidateQueries).toHaveBeenCalled();
    expect(toastShow).not.toHaveBeenCalled();
  });

  it('handleUnbookmark reverts optimistic state and toasts on SDK failure', async () => {
    posts = [{ id: '1', isBookmarked: true }];
    deleteBookmark.mockRejectedValue(new Error('network'));
    const hook = withRoot(() =>
      useFeedEngagement({
        getPosts: () => posts,
        setPosts: (next) => {
          posts = next;
        },
      }),
    );

    await hook.handleUnbookmark('1');

    expect(posts[0]?.isBookmarked).toBe(true);
    expect(toastShow).toHaveBeenCalledWith('errors.network', 'danger');
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
