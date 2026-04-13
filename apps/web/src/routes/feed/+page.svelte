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
		postsDelete
	} from 'api-client';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Loader2, PenSquare } from 'lucide-svelte';
	import { Avatar, Button, SegmentToggle } from 'ui';
	import PostCard from '$lib/components/feed/post-card.svelte';
	import CreatePostModal from '$lib/components/feed/create-post-modal.svelte';

	// Auth check
	const session = createAuthSession(() => ({
		query: { retry: false, enabled: browser }
	}));
	const user = $derived(session.data?.user);
	const authenticated = $derived(session.data?.authenticated ?? false);
	const currentUserId = $derived(String((user as Record<string, unknown> | undefined)?.id ?? ''));
	const userName = $derived(String((user as Record<string, unknown> | undefined)?.name ?? ''));
	const userPhoto = $derived(((user as Record<string, unknown> | undefined)?.photoURL ?? null) as string | null);

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
		{ value: 'QUESTION', label: 'Question' }
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

	const rawData = $derived(
		feedQuery.data as Record<string, unknown> | undefined
	);

	// When data arrives, append to allPosts
	$effect(() => {
		if (!rawData) return;
		const postsArr = (
			Array.isArray(rawData)
				? rawData
				: (rawData as Record<string, unknown>)?.posts ?? []
		) as Record<string, unknown>[];

		const nextCursor = (rawData as Record<string, unknown>)?.nextCursor as string | undefined;

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
		const nextCursor = (rawData as Record<string, unknown>)?.nextCursor as string | undefined;
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

	async function handleLike(id: string) {
		likedPosts = new Set([...likedPosts, id]);
		unlikedPosts = new Set([...unlikedPosts].filter(x => x !== id));
		// Optimistic count update
		allPosts = allPosts.map(p => {
			if (String(p.id) === id) {
				return { ...p, isLiked: true, likeCount: Number(p.likeCount ?? p.likesCount ?? 0) + 1 };
			}
			return p;
		});
		await engagementLike(id);
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
		allPosts = allPosts.filter(p => String(p.id) !== id);
		await postsDelete(id);
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	async function handleRepost(id: string) {
		await engagementRepost(id);
		queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
	}

	async function handleReport(id: string) {
		await engagementReport(id);
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
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
	</div>
{:else if authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-2xl px-4">
			<!-- Trigger bar -->
			<button
				class="flex w-full items-center gap-3 rounded-xl border p-4 transition-colors hover:opacity-80 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50"
				onclick={() => showCreateModal = true}
			>
				<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" />
				<span class="flex-1 text-left text-sm text-gray-400 dark:text-neutral-500">What's on your mind?</span>
				<PenSquare size={18} class="text-gray-400 dark:text-neutral-500" />
			</button>

			<!-- Filters -->
			<div class="mt-4 flex justify-center">
				<SegmentToggle
					options={filterOptions}
					selected={selectedFilter}
					size="sm"
					onchange={handleFilterChange}
				/>
			</div>

			<!-- Post list -->
			<div class="mt-6 space-y-4">
				{#each allPosts as post (String(post.id))}
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
					/>
				{/each}
			</div>

			<!-- Loading / empty -->
			{#if feedQuery.isLoading && allPosts.length === 0}
				<div class="flex justify-center py-12">
					<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
				</div>
			{:else if allPosts.length === 0 && !feedQuery.isLoading}
				<div class="py-12 text-center">
					<p class="text-sm text-gray-400 dark:text-neutral-500">No posts yet. Be the first to share something!</p>
				</div>
			{/if}

			<!-- Infinite scroll sentinel -->
			{#if hasMore && allPosts.length > 0}
				<div bind:this={sentinelEl} class="flex justify-center py-8">
					{#if loadingMore}
						<Loader2 size={20} class="animate-spin text-gray-400 dark:text-neutral-500" />
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
{/if}
