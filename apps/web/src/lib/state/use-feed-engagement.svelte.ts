// @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  engagementBookmark,
  engagementLike,
  engagementReport,
  engagementRepost,
  engagementUnbookmark,
  engagementUnlike,
  engagementVote,
  getFeedGetTimelineQueryKey,
  isApiError,
  postsDelete,
} from 'api-client';
import { type ReactionType, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';
import { track } from '$lib/utils/analytics/track';
import { undoableAction } from '$lib/utils/undoable-action';

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
    return Boolean(post.isLiked ?? post.liked ?? false);
  }

  function isPostBookmarked(post: Post): boolean {
    const id = String(post.id);
    if (bookmarkedPosts.has(id)) return true;
    if (unbookmarkedPosts.has(id)) return false;
    return Boolean(post.isBookmarked ?? post.bookmarked ?? false);
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
    const wasLiked = Boolean(target?.isLiked ?? target?.liked);
    const previousType = (target?.reactionType as ReactionType | null | undefined) ?? null;

    likedPosts = new Set([...likedPosts, id]);
    unlikedPosts = new Set([...unlikedPosts].filter((x) => x !== id));
    setPosts(
      snapshotPosts.map((p) => {
        if (String(p.id) !== id) return p;
        const prevCount = Number(p.likesCount ?? p.likeCount ?? 0);
        return {
          ...p,
          isLiked: true,
          reactionType: newType,
          likesCount: wasLiked ? prevCount : prevCount + 1,
          likeCount: wasLiked ? prevCount : prevCount + 1,
        };
      }),
    );

    try {
      await engagementLike(id, {
        body: JSON.stringify({ reactionType: newType }),
        headers: { 'Content-Type': 'application/json' },
      });
      track(wasLiked ? 'post_reaction_changed' : 'post_reacted', {
        postId: id,
        reactionType: newType,
        previousType,
      });
      queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
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
        const prevCount = Number(p.likesCount ?? p.likeCount ?? 0);
        return {
          ...p,
          isLiked: false,
          reactionType: null,
          likesCount: Math.max(0, prevCount - 1),
          likeCount: Math.max(0, prevCount - 1),
        };
      }),
    );

    try {
      await engagementUnlike(id);
      track('post_unreacted', { postId: id });
      queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
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
    await engagementBookmark(id);
    queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
  }

  async function handleUnbookmark(id: string) {
    unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
    bookmarkedPosts = new Set([...bookmarkedPosts].filter((x) => x !== id));
    setPosts(getPosts().map((p) => (String(p.id) === id ? { ...p, isBookmarked: false } : p)));
    await engagementUnbookmark(id);
    queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
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
        queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
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
          repostsCount: Number(p.repostsCount ?? p.repostCount ?? 0) + 1,
        };
      }),
    );
    try {
      if (commentary) {
        await engagementRepost(id, {
          body: JSON.stringify({ commentary }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        await engagementRepost(id);
      }
      track('post_reposted', { postId: id, withCommentary: commentary.length > 0 });
      queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
    } catch (err) {
      setPosts(snapshot);
      const message =
        isApiError(err) && err.statusCode === 409
          ? locale.t('feed.quoteRepost.alreadyRepostedError')
          : locale.t('feed.quoteRepost.genericError');
      toastState.show(message, 'danger');
    }
  }

  async function submitReport(id: string, reason: string) {
    await engagementReport(id, {
      body: JSON.stringify({ reason }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function handleVote(id: string, optionIndex: number) {
    if (votingPosts.has(id)) return;
    const t = locale.t;
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
      await engagementVote(id, {
        body: JSON.stringify({ optionIndex }),
        headers: { 'Content-Type': 'application/json' },
      });
      track('poll_voted', { postId: id, optionIndex });
      queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
    } catch (err) {
      setPosts(snapshot);
      const message =
        isApiError(err) && err.statusCode === 409
          ? t('feed.poll.alreadyVotedError')
          : t('feed.poll.voteError');
      toastState.show(message, 'danger');
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
