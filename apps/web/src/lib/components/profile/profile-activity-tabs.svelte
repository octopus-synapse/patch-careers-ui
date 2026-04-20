<script lang="ts">
import {
  createActivityGetUserActivities,
  createFeedGetUserPosts,
  createUserEngagementGetComments,
  createUserEngagementGetReactions,
} from 'api-client';
import { Activity, FileText, Heart, MessageCircle } from 'lucide-svelte';
import type { Component } from 'svelte';
import { EmptyState, Skeleton, Tabs } from 'ui';
import { browser } from '$app/environment';
import { relativeFrom } from '$lib/format/relative';
import { locale } from '$lib/locale.svelte';

type Props = {
  userId: string;
};

let { userId }: Props = $props();

type TabKey = 'posts' | 'comments' | 'reactions' | 'activity';

const t = $derived(locale.t);
let active = $state<TabKey>('posts');

const tabs = $derived([
  { value: 'posts', label: t('feed.tabsPosts') },
  { value: 'comments', label: t('feed.tabsComments') },
  { value: 'reactions', label: t('feed.tabsReactions') },
  { value: 'activity', label: t('feed.tabsActivity') },
]);

const postsQuery = createFeedGetUserPosts(
  () => userId,
  () => ({ limit: 20 }),
  () => ({ query: { enabled: browser && !!userId && active === 'posts' } }),
);

const commentsQuery = createUserEngagementGetComments(
  () => userId,
  () => ({ limit: 20 }),
  () => ({ query: { enabled: browser && !!userId && active === 'comments' } }),
);

const reactionsQuery = createUserEngagementGetReactions(
  () => userId,
  () => ({ limit: 20 }),
  () => ({ query: { enabled: browser && !!userId && active === 'reactions' } }),
);

const activitiesQuery = createActivityGetUserActivities(
  () => userId,
  () => ({ query: { enabled: browser && !!userId && active === 'activity' } }),
);

type PostItem = {
  id: string;
  content?: string | null;
  title?: string | null;
  type?: string;
  createdAt?: string | null;
};

type CommentItem = {
  id: string;
  content?: string | null;
  createdAt?: string | null;
  post?: { id: string; content?: string | null; type?: string | null } | null;
};

type ReactionItem = {
  id: string;
  reactionType?: string;
  createdAt?: string | null;
  post?: { id: string; content?: string | null; type?: string | null } | null;
};

type ActivityItem = {
  id: string;
  type?: string;
  createdAt?: string | null;
};

const posts = $derived.by<PostItem[]>(() => {
  const data = postsQuery.data as Record<string, unknown> | undefined;
  const items =
    (data?.posts as PostItem[] | undefined) ?? (Array.isArray(data) ? (data as PostItem[]) : []);
  return items;
});

const comments = $derived.by<CommentItem[]>(() => {
  const data = commentsQuery.data as Record<string, unknown> | undefined;
  return (data?.comments as CommentItem[] | undefined) ?? [];
});

const reactions = $derived.by<ReactionItem[]>(() => {
  const data = reactionsQuery.data as Record<string, unknown> | undefined;
  return (data?.reactions as ReactionItem[] | undefined) ?? [];
});

const activities = $derived.by<ActivityItem[]>(() => {
  const data = activitiesQuery.data as Record<string, unknown> | undefined;
  const section = data?.activities as Record<string, unknown> | undefined;
  return (section?.data as ActivityItem[] | undefined) ?? [];
});


function activityLabel(type?: string): string {
  if (!type) return '';
  const map: Record<string, string> = {
    RESUME_CREATED: 'created a resume',
    RESUME_UPDATED: 'updated a resume',
    RESUME_SHARED: 'shared a resume',
    RESUME_PUBLISHED: 'published a resume',
    THEME_PUBLISHED: 'published a theme',
    ACHIEVEMENT_EARNED: 'earned an achievement',
    SKILL_ADDED: 'added a skill',
    PROFILE_UPDATED: 'updated their profile',
    FOLLOWED_USER: 'followed someone',
    CONNECTED_USER: 'connected with someone',
  };
  return map[type] ?? type.toLowerCase().replace(/_/g, ' ');
}

function reactionEmoji(type?: string): string {
  const map: Record<string, string> = {
    LIKE: '👍',
    CELEBRATE: '🎉',
    LOVE: '❤️',
    INSIGHTFUL: '💡',
    CURIOUS: '🤔',
  };
  return type ? (map[type] ?? '👍') : '👍';
}
</script>

<div class="mt-6 space-y-3">
	<Tabs {tabs} selected={active} onchange={(v) => (active = v as TabKey)} />

	{#if active === 'posts'}
		{#if postsQuery.isLoading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="text" width="60%" />
						<div class="mt-2"><Skeleton shape="text" width="40%" /></div>
					</div>
				{/each}
			</div>
		{:else if posts.length === 0}
			<EmptyState
				message={t('feed.noUserPosts')}
				icon={FileText as unknown as Component<{ size: number; class?: string }>}
			/>
		{:else}
			<ul class="space-y-3">
				{#each posts as post (post.id)}
					<li class="rounded-xl border p-4 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
						{#if post.title}
							<h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{post.title}</h3>
						{/if}
						{#if post.content}
							<p class="mt-1 line-clamp-3 text-sm text-gray-600 dark:text-neutral-400">{post.content}</p>
						{/if}
						<div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400 dark:text-neutral-500">
							{#if post.type}
								<span class="rounded-full bg-gray-100 px-2 py-0.5 font-medium dark:bg-neutral-700">{post.type}</span>
							{/if}
							{#if post.createdAt}
								<span>{relativeFrom(post.createdAt)}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if active === 'comments'}
		{#if commentsQuery.isLoading}
			<div class="space-y-2">
				{#each Array(4) as _}
					<div class="rounded-md border p-3 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="text" width="50%" />
						<div class="mt-1.5"><Skeleton shape="text" width="80%" /></div>
					</div>
				{/each}
			</div>
		{:else if comments.length === 0}
			<EmptyState
				message={t('feed.noUserComments')}
				icon={MessageCircle as unknown as Component<{ size: number; class?: string }>}
			/>
		{:else}
			<ul class="space-y-2">
				{#each comments as item (item.id)}
					<li class="rounded-md border px-3 py-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
						<div class="flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
							<MessageCircle size={12} />
							<span>{t('feed.commentedOn')}</span>
							{#if item.createdAt}
								<span aria-hidden="true">·</span>
								<span>{relativeFrom(item.createdAt)}</span>
							{/if}
						</div>
						{#if item.content}
							<p class="mt-1 line-clamp-3 text-sm text-gray-700 dark:text-neutral-300">"{item.content}"</p>
						{/if}
						{#if item.post?.content}
							<p class="mt-1 line-clamp-1 text-[11px] italic text-gray-400 dark:text-neutral-500">
								on: {item.post.content}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{:else if active === 'reactions'}
		{#if reactionsQuery.isLoading}
			<div class="space-y-2">
				{#each Array(4) as _}
					<div class="flex items-center gap-3 rounded-md border p-3 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="circle" width="2rem" height="2rem" />
						<Skeleton shape="text" width="60%" />
					</div>
				{/each}
			</div>
		{:else if reactions.length === 0}
			<EmptyState
				message={t('feed.noUserReactions')}
				icon={Heart as unknown as Component<{ size: number; class?: string }>}
			/>
		{:else}
			<ul class="space-y-2">
				{#each reactions as item (item.id)}
					<li class="flex items-start gap-3 rounded-md border px-3 py-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
						<span aria-hidden="true" class="text-lg">{reactionEmoji(item.reactionType)}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
								<span>{t('feed.reactedTo')}</span>
								{#if item.createdAt}
									<span aria-hidden="true">·</span>
									<span>{relativeFrom(item.createdAt)}</span>
								{/if}
							</div>
							{#if item.post?.content}
								<p class="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-neutral-300">{item.post.content}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if activitiesQuery.isLoading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="flex items-center gap-3 rounded-md border p-3 border-gray-200 dark:border-neutral-800">
					<Skeleton shape="circle" width="2rem" height="2rem" />
					<Skeleton shape="text" width="60%" />
				</div>
			{/each}
		</div>
	{:else if activities.length === 0}
		<EmptyState
			message={t('feed.noUserActivities')}
			icon={Activity as unknown as Component<{ size: number; class?: string }>}
		/>
	{:else}
		<ul class="space-y-2">
			{#each activities as item (item.id)}
				<li class="flex items-center gap-3 rounded-md border px-3 py-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
					<Activity size={14} class="text-gray-400 dark:text-neutral-500" />
					<span class="flex-1 text-xs text-gray-700 dark:text-neutral-300">{activityLabel(item.type)}</span>
					{#if item.createdAt}
						<span class="text-[11px] text-gray-400 dark:text-neutral-500">{relativeFrom(item.createdAt)}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
