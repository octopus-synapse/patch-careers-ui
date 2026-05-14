<script lang="ts">
  /**
   * Profile activity tabs — burra: 4 tabs (posts/comments/reactions/activity).
   */
import {
  createGetV1FeedUserUserId,
  createGetV1UsersUserIdActivities,
  createGetV1UsersUserIdComments,
  createGetV1UsersUserIdLikes,
} from 'api-client';
import { Activity, FileText, Heart, MessageCircle } from 'lucide-svelte';
import { Badge, EmptyState, Skeleton, Tabs } from 'ui';
import { browser } from '$app/environment';
import { asIcon } from '$lib/types/icons';
import { relativeFrom } from '$lib/utils/relative';
import { locale } from '$lib/state/locale.svelte';

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

const postsQuery = createGetV1FeedUserUserId(() => userId,
  { limit: 20 },
  { query: { enabled: () => browser && !!userId && active === 'posts'} },
);

const commentsQuery = createGetV1UsersUserIdComments(() => userId,
  { limit: 20 },
  { query: { enabled: () => browser && !!userId && active === 'comments'} },
);

const reactionsQuery = createGetV1UsersUserIdLikes(() => userId,
  { limit: 20 },
  { query: { enabled: () => browser && !!userId && active === 'reactions'} },
);

const activitiesQuery = createGetV1UsersUserIdActivities(() => userId,
  { limit: 20 },
  { query: { enabled: () => browser && !!userId && active === 'activity'} },
);

const posts = $derived($postsQuery.data?.items);
const comments = $derived($commentsQuery.data?.items);
const reactions = $derived($reactionsQuery.data?.items);
const activities = $derived($activitiesQuery.data?.items);


function activityLabel(type: string): string {
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

function reactionEmoji(type: string): string {
  const map: Record<string, string> = {
    LIKE: '👍',
    CELEBRATE: '🎉',
    LOVE: '❤️',
    INSIGHTFUL: '💡',
    CURIOUS: '🤔',
  };
  return map[type] ?? '👍';
}
</script>

<div class="mt-6 space-y-3">
	<Tabs {tabs} selected={active} onchange={(v) => (active = v as TabKey)} />

	{#if active === 'posts'}
		{#if $postsQuery.isLoading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="text" width="60%" />
						<div class="mt-2"><Skeleton shape="text" width="40%" /></div>
					</div>
				{/each}
			</div>
		{:else if !posts || posts.length === 0}
			<EmptyState
				message={t('feed.noUserPosts')}
				icon={asIcon(FileText)}
			/>
		{:else}
			<ul class="space-y-3">
				{#each posts as post (post.id)}
					<li class="rounded-xl border p-4 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
						{#if post.content}
							<p class="mt-1 line-clamp-3 text-sm text-gray-600 dark:text-neutral-400">{post.content}</p>
						{/if}
						<div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400 dark:text-neutral-500">
							<span>{relativeFrom(post.createdAt)}</span>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if active === 'comments'}
		{#if $commentsQuery.isLoading}
			<div class="space-y-2">
				{#each Array(4) as _}
					<div class="rounded-md border p-3 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="text" width="50%" />
						<div class="mt-1.5"><Skeleton shape="text" width="80%" /></div>
					</div>
				{/each}
			</div>
		{:else if !comments || comments.length === 0}
			<EmptyState
				message={t('feed.noUserComments')}
				icon={asIcon(MessageCircle)}
			/>
		{:else}
			<ul class="space-y-2">
				{#each comments as item (item.id)}
					<li class="rounded-md border px-3 py-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
						<div class="flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
							<MessageCircle size={12} />
							<span>{t('feed.commentedOn')}</span>
							<span aria-hidden="true">·</span>
							<span>{relativeFrom(item.createdAt)}</span>
						</div>
						<p class="mt-1 line-clamp-3 text-sm text-gray-700 dark:text-neutral-300">"{item.content}"</p>
						{#if item.post.content}
							<p class="mt-1 line-clamp-1 text-[11px] italic text-gray-400 dark:text-neutral-500">
								on: {item.post.content}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{:else if active === 'reactions'}
		{#if $reactionsQuery.isLoading}
			<div class="space-y-2">
				{#each Array(4) as _}
					<div class="flex items-center gap-3 rounded-md border p-3 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="circle" width="2rem" height="2rem" />
						<Skeleton shape="text" width="60%" />
					</div>
				{/each}
			</div>
		{:else if !reactions || reactions.length === 0}
			<EmptyState
				message={t('feed.noUserReactions')}
				icon={asIcon(Heart)}
			/>
		{:else}
			<ul class="space-y-2">
				{#each reactions as item (item.postId + item.userId)}
					<li class="flex items-start gap-3 rounded-md border px-3 py-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
						<span aria-hidden="true" class="text-lg">❤</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
								<span>{t('feed.reactedTo')}</span>
								<span aria-hidden="true">·</span>
								<span>{relativeFrom(item.createdAt)}</span>
							</div>
							{#if item.post.content}
								<p class="mt-1 line-clamp-2 text-sm text-gray-700 dark:text-neutral-300">{item.post.content}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if $activitiesQuery.isLoading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="flex items-center gap-3 rounded-md border p-3 border-gray-200 dark:border-neutral-800">
					<Skeleton shape="circle" width="2rem" height="2rem" />
					<Skeleton shape="text" width="60%" />
				</div>
			{/each}
		</div>
	{:else if !activities || activities.length === 0}
		<EmptyState
			message={t('feed.noUserActivities')}
			icon={asIcon(Activity)}
		/>
	{:else}
		<ul class="space-y-2">
			{#each activities as item (item.id)}
				<li class="flex items-center gap-3 rounded-md border px-3 py-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40">
					<Activity size={14} class="text-gray-400 dark:text-neutral-500" />
					<span class="flex-1 text-xs text-gray-700 dark:text-neutral-300">{activityLabel(item.type)}</span>
					<span class="text-[11px] text-gray-400 dark:text-neutral-500">{relativeFrom(item.createdAt)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
