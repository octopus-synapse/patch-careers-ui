<script lang="ts">
	import { createAuthSession } from 'api-client';
	import {
		createFeedGetTimeline,
		getFeedGetTimelineQueryKey,
		engagementLike,
		engagementUnlike,
		engagementBookmark,
		engagementUnbookmark,
		engagementRepost,
		engagementReport,
		engagementVote,
		postsDelete
	} from 'api-client';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { Component } from 'svelte';
	import { PenSquare, Bookmark } from 'lucide-svelte';
	import { Avatar, Button, Card, EmptyState, ToastContainer, toastState } from 'ui';
	import PostCard from '$lib/components/feed/post-card.svelte';
	import CreatePostModal from '$lib/components/feed/create-post-modal.svelte';
	import ReportModal from '$lib/components/feed/report-modal.svelte';
	import RepostModal from '$lib/components/feed/repost-modal.svelte';

	// Auth check
	const session = createAuthSession(() => ({
		query: { retry: false, enabled: browser }
	}));
	const user = $derived(session.data?.user);
	const authenticated = $derived(session.data?.authenticated);
	const currentUserId = $derived(String(user?.id ?? ''));
	const userName = $derived(String(user?.name ?? ''));
	const userPhoto = $derived((user as Record<string, unknown>)?.photoURL as string | null ?? null);

	$effect(() => {
		if (!session.isLoading && !authenticated) {
			goto('/login');
		}
	});

	// Filters
	const filterOptions = [
		{ value: 'ALL', label: 'All' },
		{ value: 'ACHIEVEMENT', label: 'Achievement' },
		{ value: 'OPPORTUNITY', label: 'Opportunity' },
		{ value: 'LEARNING', label: 'Learning' },
		{ value: 'BUILD', label: 'Build' },
		{ value: 'QUESTION', label: 'Question' },
		{ value: 'CHALLENGE', label: 'Challenge' }
	];
	let selectedFilter = $state('ALL');

	// Cursor-based pagination
	let cursor = $state<string | undefined>(undefined);
	let allPosts = $state<Record<string, unknown>[]>([]);
	let hasMore = $state(true);
	let loadingMore = $state(false);

	// Local engagement state overrides
	let likedPosts = $state<Set<string>>(new Set());
	let unlikedPosts = $state<Set<string>>(new Set());
	let bookmarkedPosts = $state<Set<string>>(new Set());
	let unbookmarkedPosts = $state<Set<string>>(new Set());

	// Create post modal
	let showCreateModal = $state(false);

	// Report modal
	let showReportModal = $state(false);
	let reportPostId = $state<string | null>(null);

	// Repost modal
	let showRepostModal = $state(false);
	let repostTargetPost = $state<Record<string, unknown> | null>(null);

	const queryClient = useQueryClient();

	const feedQuery = createFeedGetTimeline(
		() => ({
			cursor,
			limit: 20,
			type: selectedFilter === 'ALL' ? undefined : selectedFilter
		}),
		() => ({
			query: {
				enabled: authenticated
			}
		})
	);

	const rawData = $derived(feedQuery.data);

	// When data arrives, append to allPosts
	$effect(() => {
		if (!rawData) return;
		const postsArr = (Array.isArray(rawData) ? rawData : rawData?.posts) as Record<string, unknown>[] | undefined;
		if (!postsArr) return;

		const nextCursor = rawData?.nextCursor;

		if (cursor === undefined) {
			// First page or filter change
			allPosts = postsArr;
		} else {
			// Appending
			const existingIds = new Set(allPosts.map(p => String(p.id)));
			const newPosts = postsArr.filter(p => !existingIds.has(String(p.id)));
			if (newPosts.length > 0) {
				allPosts = [...allPosts, ...newPosts];
			}
		}

		hasMore = !!nextCursor && postsArr.length > 0;
		loadingMore = false;
	});

	// Reset when filter changes
	$effect(() => {
		// Track selectedFilter
		selectedFilter;
		cursor = undefined;
		allPosts = [];
		hasMore = true;
		likedPosts = new Set();
		unlikedPosts = new Set();
		bookmarkedPosts = new Set();
		unbookmarkedPosts = new Set();
	});

	// Intersection observer for infinite scroll
	let sentinelEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!sentinelEl || !browser) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !feedQuery.isLoading && !loadingMore) {
					loadNextPage();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(sentinelEl);
		return () => observer.disconnect();
	});

	function loadNextPage() {
		if (!rawData || loadingMore) return;
		const nextCursor = rawData?.nextCursor;
		if (nextCursor) {
			loadingMore = true;
			cursor = nextCursor;
		}
	}

	function isPostLiked(post: Record<string, unknown>): boolean {
		const id = String(post.id);
		if (likedPosts.has(id)) return true;
		if (unlikedPosts.has(id)) return false;
		return Boolean(post.isLiked ?? post.liked ?? false);
	}

	function isPostBookmarked(post: Record<string, unknown>): boolean {
		const id = String(post.id);
		if (bookmarkedPosts.has(id)) return true;
		if (unbookmarkedPosts.has(id)) return false;
		return Boolean(post.isBookmarked ?? post.bookmarked ?? false);
	}

	async function handleLike(id: string, reactionType?: string) {
		likedPosts = new Set([...likedPosts, id]);
		unlikedPosts = new Set([...unlikedPosts].filter(x => x !== id));
		allPosts = allPosts.map(p => {
			if (String(p.id) === id) {
				return { ...p, isLiked: true, likeCount: Number(p.likeCount ?? p.likesCount ?? 0) + 1 };
			}
			return p;
		});
		if (reactionType) {
			await engagementLike(id, {
				body: JSON.stringify({ reactionType }),
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			await engagementLike(id);
		}
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	async function handleUnlike(id: string) {
		unlikedPosts = new Set([...unlikedPosts, id]);
		likedPosts = new Set([...likedPosts].filter(x => x !== id));
		allPosts = allPosts.map(p => {
			if (String(p.id) === id) {
				return { ...p, isLiked: false, likeCount: Math.max(0, Number(p.likeCount ?? p.likesCount ?? 0) - 1) };
			}
			return p;
		});
		await engagementUnlike(id);
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	async function handleBookmark(id: string) {
		bookmarkedPosts = new Set([...bookmarkedPosts, id]);
		unbookmarkedPosts = new Set([...unbookmarkedPosts].filter(x => x !== id));
		allPosts = allPosts.map(p => {
			if (String(p.id) === id) return { ...p, isBookmarked: true };
			return p;
		});
		await engagementBookmark(id);
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	async function handleUnbookmark(id: string) {
		unbookmarkedPosts = new Set([...unbookmarkedPosts, id]);
		bookmarkedPosts = new Set([...bookmarkedPosts].filter(x => x !== id));
		allPosts = allPosts.map(p => {
			if (String(p.id) === id) return { ...p, isBookmarked: false };
			return p;
		});
		await engagementUnbookmark(id);
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	async function handleDelete(id: string) {
		const confirmed = window.confirm('Tem certeza que deseja deletar este post?');
		if (!confirmed) return;
		allPosts = allPosts.filter(p => String(p.id) !== id);
		await postsDelete(id);
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	function handleRepost(id: string) {
		const post = allPosts.find(p => String(p.id) === id);
		if (post) {
			repostTargetPost = post;
			showRepostModal = true;
		}
	}

	async function handleRepostSubmit(content: string) {
		if (!repostTargetPost) return;
		const id = String(repostTargetPost.id);
		showRepostModal = false;
		repostTargetPost = null;
		try {
			if (content) {
				await engagementRepost(id, {
					body: JSON.stringify({ content }),
					headers: { 'Content-Type': 'application/json' }
				});
			} else {
				await engagementRepost(id);
			}
			queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
		} catch (err: unknown) {
			const error = err as { status?: number };
			if (error.status === 409) {
				toastState.show('Voce ja repostou isso', 'error');
			}
		}
	}

	function handleReport(id: string) {
		reportPostId = id;
		showReportModal = true;
	}

	async function handleReportSubmit(reason: string) {
		if (!reportPostId) return;
		showReportModal = false;
		await engagementReport(reportPostId, {
			body: JSON.stringify({ reason }),
			headers: { 'Content-Type': 'application/json' }
		});
		reportPostId = null;
	}

	async function handleVote(id: string, optionIndex: number) {
		await engagementVote(id, {
			body: JSON.stringify({ optionIndex }),
			headers: { 'Content-Type': 'application/json' }
		});
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	function handlePostCreated() {
		showCreateModal = false;
		cursor = undefined;
		allPosts = [];
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	function handleFilterChange(value: string) {
		selectedFilter = value;
	}
</script>

<svelte:head>
	<title>Feed</title>
</svelte:head>

{#if session.isLoading}
	<!-- Skeleton loading for auth check -->
	<div class="flex min-h-screen items-center justify-center pt-14">
		<div class="mx-auto w-full max-w-2xl space-y-4 px-4">
			{#each [1, 2, 3] as _}
				<div class="animate-pulse rounded-xl border border-gray-200 dark:border-neutral-700/50 p-4 space-y-3">
					<div class="flex gap-3">
						<div class="h-12 w-12 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
						<div class="flex-1 space-y-2">
							<div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-700"></div>
							<div class="h-2 w-1/4 rounded bg-gray-200 dark:bg-neutral-700"></div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="h-3 w-full rounded bg-gray-200 dark:bg-neutral-700"></div>
						<div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-700"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else if authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-2xl px-4">
			<!-- Trigger bar -->
			<Card class="shadow-sm hover:shadow-md transition-shadow">
				<div class="flex items-center gap-2">
					<button
						class="flex flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:opacity-80"
						onclick={() => showCreateModal = true}
					>
						<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" />
						<span class="flex-1 text-left text-sm text-gray-400 dark:text-neutral-500">What's on your mind?</span>
						<PenSquare size={18} class="text-gray-400 dark:text-neutral-500" />
					</button>
					<Button variant="ghost" size="sm" onclick={() => goto('/feed/bookmarks')}>
						<Bookmark size={18} />
						<span class="text-xs">Saved</span>
					</Button>
				</div>
			</Card>

			<!-- Filters — horizontal scrollable pills -->
			<div class="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
				{#each filterOptions as option}
					<button
						class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {selectedFilter === option.value ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}"
						onclick={() => handleFilterChange(option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<!-- Post list -->
			<div class="mt-6 space-y-4">
				{#each allPosts as post (String(post.id))}
					<div class="post-enter">
						<PostCard
							post={{
								...post,
								isLiked: isPostLiked(post),
								isBookmarked: isPostBookmarked(post)
							}}
							{currentUserId}
							onlike={handleLike}
							onunlike={handleUnlike}
							onbookmark={handleBookmark}
							onunbookmark={handleUnbookmark}
							ondelete={handleDelete}
							onrepost={handleRepost}
							onreport={handleReport}
							onvote={handleVote}
						/>
					</div>
				{/each}
			</div>

			<!-- Loading / empty -->
			{#if feedQuery.isLoading && allPosts.length === 0}
				<div class="mt-6 space-y-4">
					{#each [1, 2, 3] as _}
						<div class="animate-pulse rounded-xl border border-gray-200 dark:border-neutral-700/50 p-4 space-y-3">
							<div class="flex gap-3">
								<div class="h-12 w-12 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
								<div class="flex-1 space-y-2">
									<div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-700"></div>
									<div class="h-2 w-1/4 rounded bg-gray-200 dark:bg-neutral-700"></div>
								</div>
							</div>
							<div class="space-y-2">
								<div class="h-3 w-full rounded bg-gray-200 dark:bg-neutral-700"></div>
								<div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-700"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if allPosts.length === 0 && !feedQuery.isLoading}
				<div class="py-12">
					<EmptyState message="No posts yet. Be the first to share!" icon={PenSquare as unknown as Component<{ size: number; class?: string }>} />
				</div>
			{/if}

			<!-- Infinite scroll sentinel -->
			{#if hasMore && allPosts.length > 0}
				<div bind:this={sentinelEl} class="flex justify-center py-8">
					{#if loadingMore}
						<div class="flex gap-2">
							{#each [1, 2, 3] as _}
								<div class="h-2 w-2 animate-bounce rounded-full bg-gray-300 dark:bg-neutral-600" style="animation-delay: {_ * 150}ms"></div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</main>
	</div>

	<!-- Create post modal -->
	<CreatePostModal
		open={showCreateModal}
		oncreate={handlePostCreated}
		oncancel={() => showCreateModal = false}
	/>

	<!-- Report modal -->
	<ReportModal
		open={showReportModal}
		onsubmit={handleReportSubmit}
		oncancel={() => { showReportModal = false; reportPostId = null; }}
	/>

	<!-- Repost modal -->
	<RepostModal
		open={showRepostModal}
		post={repostTargetPost}
		onsubmit={handleRepostSubmit}
		oncancel={() => { showRepostModal = false; repostTargetPost = null; }}
	/>

	<ToastContainer />
{/if}

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.post-enter {
		animation: fadeIn 0.3s ease-out;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
