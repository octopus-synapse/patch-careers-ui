import { browser } from '$app/environment';

type Post = Record<string, unknown>;

type RawData = unknown;

type Options = {
  getRawData: () => RawData;
};

export function useFeedPagination({ getRawData }: Options) {
  let cursor = $state<string | undefined>(undefined);
  let allPosts = $state<Post[]>([]);
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let newPostsBuffer = $state<Post[]>([]);

  function extractPosts(rawData: unknown): Post[] | undefined {
    if (!rawData) return undefined;
    if (Array.isArray(rawData)) return rawData as Post[];
    const maybe = (rawData as { posts?: unknown }).posts;
    return Array.isArray(maybe) ? (maybe as Post[]) : undefined;
  }

  function extractNextCursor(rawData: unknown): string | undefined {
    if (!rawData || Array.isArray(rawData)) return undefined;
    const c = (rawData as { nextCursor?: unknown }).nextCursor;
    return typeof c === 'string' ? c : undefined;
  }

  $effect(() => {
    const rawData = getRawData();
    const postsArr = extractPosts(rawData);
    if (!postsArr) return;

    const nextCursor = extractNextCursor(rawData);

    if (cursor === undefined) {
      if (allPosts.length === 0) {
        allPosts = postsArr;
        newPostsBuffer = [];
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
    const nextCursor = extractNextCursor(getRawData());
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
