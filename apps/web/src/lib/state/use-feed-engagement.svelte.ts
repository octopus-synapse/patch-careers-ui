import { useQueryClient } from '@tanstack/svelte-query';
import {
  engagementPostsBookmarkDelete,
  engagementPostsBookmarkPost,
  engagementPostsLikeDelete,
  engagementPostsLikePost,
  engagementPostsPollVote,
  engagementPostsReport,
  engagementPostsRepost,
  feedListQueryKey,
  postsDelete,
} from 'api-client';
import { type ReactionType, toastState } from 'ui';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { locale } from '$lib/state/locale.svelte';
import { track } from '$lib/utils/analytics/track';
import { undoableAction } from '$lib/utils/undoable-action';

/**
 * Engagement overlay (frontend-burro): owns the optimistic-update sets for
 * like/bookmark/vote, snapshots the previous list before each mutation, and
 * rolls back on error. Domain truth (label, color, copy) is **not** computed
 * here — every visible string comes from the locale layer or the backend
 * payload. The only "logic" the hook owns is UX (debounce, snapshot, retry).
 *
 * Canonical post fields read by this hook (post-F1 backend):
 *   - `isLiked: boolean`
 *   - `isBookmarked: boolean`
 *   - `hasVoted: boolean`
 *   - `reactionType: ReactionType | null`
 *   - `likesCount: number`
 *   - `repostsCount: number`
 *   - `votesCount: number`
 *   - `myVoteIndex: number | null`
 */
type Post = Record<string, unknown>;

type Options = {
  getPosts: () => Post[];
  setPosts: (posts: Post[]) => void;
};

export function useFeedEngagement({ getPosts, setPosts }: Options) {
  const queryClient = useQueryClient();

  let likedPosts = $state<Set<string>>(new Set());
  let unlikedPosts = $state<Set<string>>(new Set());
  let bookmarkedPosts = $state<Set<string>>(new Set());
  let unbookmarkedPosts = $state<Set<string>>(new Set());
  let votingPosts = $state<Set<string>>(new Set());

  function isPostLiked(post: Post): boolean {
    const id = String(post.id);
    if (likedPosts.has(id)) return true;
    if (unlikedPosts.has(id)) return false;
    return Boolean(post.isLiked);
  }

  function isPostBookmarked(post: Post): boolean {
    const id = String(post.id);
    if (bookmarkedPosts.has(id)) return true;
    if (unbookmarkedPosts.has(id)) return false;
    return Boolean(post.isBookmarked);
  }

  function resetOverrides() {
    likedPosts = new Set();
    unlikedPosts = new Set();
    bookmarkedPosts = new Set();
    unbookmarkedPosts = new Set();
  }

  async function handleLike(id: string, reactionType?: ReactionType) {
    const newType: ReactionType = reactionType ?? 'LIKE';
    const snapshotPosts = getPosts();
    const snapshotLiked = likedPosts;
    const snapshotUnliked = unlikedPosts;
    const target = snapshotPosts.find((p) => String(p.id) === id);
    const wasLiked = Boolean(target?.isLiked);
    const previousType = (target?.reactionType as ReactionType | null | undefined) ?? null;

    likedPosts = new Set([...likedPosts, id]);
    unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
    setPosts(
      snapshotPosts.map((p) => {
        if (String(p.id) !== id) return p;
        const prevCount = Number(p.likesCount ?? 0);
        return {
          ...p,
          isLiked: true,
          reactionType: newType,
          likesCount: wasLiked ? prevCount : prevCount + 1,
        };
      }),
    );

    try {
      await engagementPostsLikePost(id, { reactionType: newType });
      track(wasLiked ? 'post_reaction_changed' : 'post_reacted', {
        postId: id,
        reactionType: newType,
        previousType,
      });
      queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
    } catch {
      setPosts(snapshotPosts);
      likedPosts = snapshotLiked;
      unlikedPosts = snapshotUnliked;
      toastState.show(locale.t('feed.reactions.errorGeneric'), 'danger');
    }
  }

  async function handleUnlike(id: string) {
    const snapshotPosts = getPosts();
    const snapshotLiked = likedPosts;
    const snapshotUnliked = unlikedPosts;

    unlikedPosts = new Set([...unlikedPosts, id]);
    likedPosts = new Set([...likedPosts].filter((x) => x !== id));
    setPosts(
      snapshotPosts.map((p) => {
        if (String(p.id) !== id) return p;
        const prevCount = Number(p.likesCount ?? 0);
        return {
          ...p,
          isLiked: false,
          reactionType: null,
          likesCount: Math.max(0, prevCount - 1),
        };
      }),
    );

    try {
      await engagementPostsLikeDelete(id);
      track('post_unreacted', { postId: id });
      queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
    } catch {
      setPosts(snapshotPosts);
      likedPosts = snapshotLiked;
      unlikedPosts = snapshotUnliked;
      toastState.show(locale.t('feed.reactions.errorGeneric'), 'danger');
    }
  }

  async function handleBookmark(id: string) {
    bookmarkedPosts = new Set([...bookmarkedPosts, id]);
    unbookmarkedPosts = new Set([...unbookmarkedPosts].filter((x) => x !== id));
    setPosts(getPosts().map((p) => (String(p.id) === id ? { ...p, isBookmarked: true } : p)));
    await engagementPostsBookmarkPost(id);
    queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
  }

  async function handleUnbookmark(id: string) {
    unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
    bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
    setPosts(getPosts().map((p) => (String(p.id) === id ? { ...p, isBookmarked: false } : p)));
    await engagementPostsBookmarkDelete(id);
    queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
  }

  function handleDelete(id: string) {
    const snapshot = getPosts();
    undoableAction({
      apply: () => {
        setPosts(getPosts().filter((p) => String(p.id) !== id));
      },
      revert: () => {
        setPosts(snapshot);
      },
      commit: () => postsDelete(id),
      onCommitted: () => {
        queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
      },
      message: locale.t('feed.postDeleted'),
      undoLabel: locale.t('feed.undo'),
      errorMessage: locale.t('feed.deleteFailed'),
    });
  }

  async function submitRepost(id: string, commentary: string) {
    const snapshot = getPosts();
    setPosts(
      snapshot.map((p) => {
        if (String(p.id) !== id) return p;
        return {
          ...p,
          isReposted: true,
          repostsCount: Number(p.repostsCount ?? 0) + 1,
        };
      }),
    );
    try {
      await engagementPostsRepost(id, commentary ? { commentary } : {});
      track('post_reposted', { postId: id, withCommentary: commentary.length > 0 });
      queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
    } catch (err) {
      setPosts(snapshot);
      handleApiError(err);
    }
  }

  async function submitReport(id: string, reason: string) {
    await engagementPostsReport(id, { reason });
  }

  async function handleVote(id: string, optionIndex: number) {
    if (votingPosts.has(id)) return;
    const snapshot = getPosts();
    votingPosts = new Set([...votingPosts, id]);
    setPosts(
      snapshot.map((p) => {
        if (String(p.id) !== id) return p;
        const data = (p.data ?? {}) as Record<string, unknown>;
        const options = Array.isArray(data.options) ? [...data.options] : [];
        const current = options[optionIndex] as { votes?: number } | undefined;
        if (current) {
          options[optionIndex] = { ...current, votes: Number(current.votes ?? 0) + 1 };
        }
        return {
          ...p,
          hasVoted: true,
          myVoteIndex: optionIndex,
          votesCount: Number(p.votesCount ?? 0) + 1,
          data: { ...data, options },
        };
      }),
    );
    try {
      await engagementPostsPollVote(id, { optionIndex });
      track('poll_voted', { postId: id, optionIndex });
      queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
    } catch (err) {
      setPosts(snapshot);
      handleApiError(err);
    } finally {
      votingPosts = new Set([...votingPosts].filter((x) => x !== id));
    }
  }

  return {
    isPostLiked,
    isPostBookmarked,
    resetOverrides,
    handleLike,
    handleUnlike,
    handleBookmark,
    handleUnbookmark,
    handleDelete,
    submitRepost,
    submitReport,
    handleVote,
  };
}
