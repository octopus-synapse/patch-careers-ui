import { browser } from '$app/environment';

/**
 * Feed pagination overlay (cursor-based, infinite-scroll friendly).
 *
 * Backend contract (post-F1, canonical):
 *   { items: Post[]; nextCursor?: string | null; hasNew?: boolean }
 *
 * The hook is the source of truth for the *materialized* list shown on screen
 * (`allPosts`) and the *buffered* set of items that arrived at the head while
 * the user was scrolling (`newPostsBuffer`). It does not derive any domain
 * decision from the payload — it just unions cursor pages and detects head
 * drift to surface a "X new posts" pill.
 */
type Post = Record<string, unknown>;

type RawData = { items?: Post[]; nextCursor?: string | null; hasNew?: boolean } | undefined;

type Options = {
  getRawData: () => RawData;
};

export function useFeedPagination({ getRawData }: Options) {
  let cursor = $state<string | undefined>(undefined);
  let allPosts = $state<Post[]>([]);
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let newPostsBuffer = $state<Post[]>([]);

  $effect(() => {
    const rawData = getRawData();
    if (!rawData) return;
    const postsArr = rawData.items;
    if (!Array.isArray(postsArr)) return;

    const nextCursor = rawData.nextCursor ?? undefined;

    if (cursor === undefined) {
      if (allPosts.length === 0) {
        // Guard against an empty→empty reassignment loop: the extracted
        // array can be a fresh `[]` reference on each tick (e.g. after
        // switching to a tab whose timeline returns zero items). This
        // effect reads `allPosts.length` while writing `allPosts`, so a
        // new empty ref retriggers it and Svelte trips
        // `effect_update_depth_exceeded`, which pegs the event loop and
        // silently kills every other click on the page.
        if (postsArr.length > 0) {
          allPosts = postsArr;
          newPostsBuffer = [];
        } else if (newPostsBuffer.length > 0) {
          newPostsBuffer = [];
        }
      } else {
        // Background refetch at head: detect new items without
        // disrupting the user's scroll position.
        const currentTopId = String(allPosts[0].id);
        const newTopIndex = postsArr.findIndex((p) => String(p.id) === currentTopId);
        if (newTopIndex > 0) {
          newPostsBuffer = postsArr.slice(0, newTopIndex);
        } else if (newTopIndex === -1) {
          newPostsBuffer = postsArr;
        }
      }
    } else {
      const existingIds = new Set(allPosts.map((p) => String(p.id)));
      const newPosts = postsArr.filter((p) => !existingIds.has(String(p.id)));
      if (newPosts.length > 0) {
        allPosts = [...allPosts, ...newPosts];
      }
    }

    hasMore = !!nextCursor && postsArr.length > 0;
    loadingMore = false;
  });

  function loadNextPage() {
    if (loadingMore) return;
    const nextCursor = getRawData()?.nextCursor ?? undefined;
    if (nextCursor) {
      loadingMore = true;
      cursor = nextCursor;
    }
  }

  function applyNewPosts() {
    if (newPostsBuffer.length === 0) return;
    const existingIds = new Set(allPosts.map((p) => String(p.id)));
    const fresh = newPostsBuffer.filter((p) => !existingIds.has(String(p.id)));
    allPosts = [...fresh, ...allPosts];
    newPostsBuffer = [];
    if (browser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function reset() {
    cursor = undefined;
    allPosts = [];
    newPostsBuffer = [];
    hasMore = true;
  }

  return {
    get cursor() {
      return cursor;
    },
    get allPosts() {
      return allPosts;
    },
    set allPosts(v: Post[]) {
      allPosts = v;
    },
    get hasMore() {
      return hasMore;
    },
    get loadingMore() {
      return loadingMore;
    },
    get newPostsBuffer() {
      return newPostsBuffer;
    },
    loadNextPage,
    applyNewPosts,
    reset,
  };
}
