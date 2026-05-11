<script lang="ts">
import { createGetV1UsersUserIdActivities } from 'api-client';
import { Activity } from 'lucide-svelte';
import { Card, EmptyState, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { asIcon } from '$lib/types/icons';
import { useAuth } from '$lib/state/auth.svelte';
import { relativeFrom } from '$lib/utils/relative';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);
const userId = $derived(String(auth.userId ?? ''));

const query = createGetV1UsersUserIdActivities(() => userId,
  {},
  { query: { enabled: () => browser && authenticated && userId !== ''} },
);

const items = $derived($query.data?.items);

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
</script>

{#if $query.isLoading}
	<div class="space-y-2">
		{#each Array(5) as _}
			<div class="flex items-center gap-3 rounded-md border p-3 border-gray-200 dark:border-neutral-800">
				<Skeleton shape="circle" width="2rem" height="2rem" />
				<Skeleton shape="text" width="60%" />
			</div>
		{/each}
	</div>
{:else if !items || items.length === 0}
	<EmptyState
		message={t('feed.noUserActivities')}
		icon={asIcon(Activity)}
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
									href="/my-profile/public/@{item.user.username ?? ''}"
									class="font-semibold text-gray-800 hover:underline dark:text-neutral-200"
								>
									{item.user.name ?? item.user.username ?? '?'}
								</a>
								<span class="ml-1 text-gray-500 dark:text-neutral-400">{activityLabel(item.type)}</span>
							{:else}
								<span class="text-gray-700 dark:text-neutral-300">{activityLabel(item.type)}</span>
							{/if}
						</div>
						<span class="text-[11px] text-gray-400 dark:text-neutral-500">{relativeFrom(item.createdAt)}</span>
					</div>
				</Card>
			</li>
		{/each}
	</ul>
{/if}
