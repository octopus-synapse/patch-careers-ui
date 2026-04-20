<script lang="ts">
import { createActivityGetFeed } from 'api-client';
import { Activity } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Card, EmptyState, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/auth.svelte';
import { relativeFrom } from '$lib/format/relative';
import { locale } from '$lib/locale.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);
const userId = $derived(String(auth.data?.user?.id ?? ''));

const query = createActivityGetFeed(
  () => userId,
  () => ({ query: { enabled: browser && authenticated && !!userId } }),
);

type ActivityItem = {
  id: string;
  type?: string;
  createdAt?: string | null;
  user?: {
    id?: string;
    name?: string | null;
    username?: string | null;
    photoURL?: string | null;
  } | null;
};

const items = $derived.by<ActivityItem[]>(() => {
  const data = query.data as Record<string, unknown> | undefined;
  const section = data?.feed as Record<string, unknown> | undefined;
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
</script>

{#if query.isLoading}
	<div class="space-y-2">
		{#each Array(5) as _}
			<div class="flex items-center gap-3 rounded-md border p-3 border-gray-200 dark:border-neutral-800">
				<Skeleton shape="circle" width="2rem" height="2rem" />
				<Skeleton shape="text" width="60%" />
			</div>
		{/each}
	</div>
{:else if items.length === 0}
	<EmptyState
		message={t('feed.noUserActivities')}
		icon={Activity as unknown as Component<{ size: number; class?: string }>}
	/>
{:else}
	<ul class="space-y-2">
		{#each items as item (item.id)}
			<li>
				<Card>
					<div class="flex items-center gap-3 text-sm">
						<Activity size={14} class="text-gray-400 dark:text-neutral-500 shrink-0" />
						<div class="min-w-0 flex-1">
							{#if item.user}
								<a
									href="/@{item.user.username ?? ''}"
									class="font-semibold text-gray-800 hover:underline dark:text-neutral-200"
								>
									{item.user.name ?? item.user.username ?? '?'}
								</a>
								<span class="ml-1 text-gray-500 dark:text-neutral-400">{activityLabel(item.type)}</span>
							{:else}
								<span class="text-gray-700 dark:text-neutral-300">{activityLabel(item.type)}</span>
							{/if}
						</div>
						{#if item.createdAt}
							<span class="text-[11px] text-gray-400 dark:text-neutral-500">{relativeFrom(item.createdAt)}</span>
						{/if}
					</div>
				</Card>
			</li>
		{/each}
	</ul>
{/if}
