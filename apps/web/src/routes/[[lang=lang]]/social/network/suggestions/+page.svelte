<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createSocialConnectionsUsersConnect,
  createSocialConnectionsUsersMeConnectionsSuggestions,
  createSocialUsersMeConnectionRecommendations,
  socialConnectionsUsersMeConnectionsSuggestionsQueryKey,
  socialConnectionsUsersMeConnectionsSuggestions,
} from 'api-client';
import { UserPlus, Users } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/utils/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import UserCard from '$lib/components/user/user-card.svelte';
import { locale } from '$lib/state/locale.svelte';
import { sentConnections } from '$lib/state/sent-connections.svelte';
import { InfiniteScrollTrigger } from 'ui';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

const query = createSocialConnectionsUsersMeConnectionsSuggestions(
  { page: '1', limit: '20' },
  { query: { enabled: browser && !!authenticated } },
);

const firstPage = $derived($query.data?.suggestions);
let extra = $state<NonNullable<typeof firstPage>['data']>([]);
let pageNum = $state(1);
let loadingMore = $state(false);

async function loadMore() {
  if (loadingMore) return;
  loadingMore = true;
  try {
    const next = pageNum + 1;
    const res = await socialConnectionsUsersMeConnectionsSuggestions({
      page: String(next),
      limit: '20',
    });
    extra = [...extra, ...res.suggestions.data];
    pageNum = next;
  } finally {
    loadingMore = false;
  }
}

const all = $derived(firstPage ? [...firstPage.data, ...extra] : extra);

const queryClient = useQueryClient();

const connectMutation = createSocialConnectionsUsersConnect({
  mutation: {
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: socialConnectionsUsersMeConnectionsSuggestionsQueryKey(),
      });
      track('connection_requested', {
        targetUserId: variables.userId,
        source: 'suggestions_page',
      });
    },
    onError(_err, variables) {
      sentConnections.remove(variables.userId);
      toastState.show(t('network.connectError'), 'danger');
    },
  },
});

function handleConnect(userId: string) {
  sentConnections.add(userId);
  $connectMutation.mutate({ userId });
}

// Skill-overlap recommendations — distinct from the generic "suggestions"
// endpoint. Pulled in parallel so the page has both a friend-of-friend list
// AND a "people who share your skills" list, ranked separately.
const skillRecsQuery = createSocialUsersMeConnectionRecommendations(
  { limit: '10' },
  { query: { enabled: browser && !!authenticated } },
);
const skillRecs = $derived($skillRecsQuery.data?.recommendations);
const skillRecsLoading = $derived($skillRecsQuery.isLoading);
</script>

<svelte:head>
	<title>{t('network.suggestions')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-5xl px-3 sm:px-6">
		<header class="mb-4 flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('network.suggestions')}
			</h1>
			{#if firstPage && firstPage.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">
					{firstPage.total}
				</span>
			{/if}
		</header>

		{#if $query.isLoading}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
				{#each Array(8) as _}
					<div class="flex flex-col items-center gap-2 rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
						<Skeleton shape="avatar" width="3.5rem" height="3.5rem" />
						<Skeleton shape="text" width="80%" />
						<Skeleton shape="text" width="60%" />
						<Skeleton shape="rect" width="100%" height="1.75rem" />
					</div>
				{/each}
			</div>
		{:else if all.length === 0}
			<EmptyState
				message={t('network.suggestionsEmpty')}
				icon={Users as unknown as Component<{ size: number; class?: string }>}
			/>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
				{#each all as suggestion (suggestion.id)}
					<UserCard
						user={{
							id: suggestion.id,
							name: suggestion.name,
							username: suggestion.username,
							photoURL: suggestion.photoURL,
						}}
						subtitle={suggestion.reason}
					>
						{#snippet actions()}
							{#if sentConnections.has(suggestion.id)}
								<span class="w-full rounded-full border py-1.5 text-center text-[10px] font-semibold opacity-60 border-gray-300 text-gray-700 dark:border-neutral-600 dark:text-neutral-300">
									{t('network.requestSent')}
								</span>
							{:else}
								<Button variant="solid" size="sm" fullWidth textCase="normal" onclick={() => handleConnect(suggestion.id)}>
									<UserPlus size={11} />
									{t('network.connect')}
								</Button>
							{/if}
						{/snippet}
					</UserCard>
				{/each}
			</div>
			<InfiniteScrollTrigger
				onLoadMore={loadMore}
				hasMore={!!firstPage && pageNum < firstPage.totalPages}
				isLoading={loadingMore}
			/>
		{/if}

		<!-- Skill-overlap recommendations: ranked by # of shared skills with the
				viewer. Distinct from the generic suggestions above. -->
		{#if skillRecsLoading}
			<div class="mt-10">
				<h2 class="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-200">
					{t('network.suggestionsSkillsTitle')}
				</h2>
				<Skeleton shape="rect" width="100%" height="6rem" />
			</div>
		{:else if skillRecs && skillRecs.length > 0}
			<div class="mt-10">
				<h2 class="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-200">
					{t('network.suggestionsSkillsTitle')}
				</h2>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
					{#each skillRecs as r (r.userId)}
						<UserCard
							user={{
								id: r.userId,
								name: r.name,
								username: r.username,
								photoURL: null,
							}}
							subtitle={t('network.suggestionsSkillsInCommon', {
								count: r.sharedSkills.length,
							})}
						>
							{#snippet actions()}
								{#if sentConnections.has(r.userId)}
									<span class="w-full rounded-full border py-1.5 text-center text-[10px] font-semibold opacity-60 border-gray-300 text-gray-700 dark:border-neutral-600 dark:text-neutral-300">
										{t('network.requestSent')}
									</span>
								{:else}
									<Button variant="solid" size="sm" fullWidth textCase="normal" onclick={() => handleConnect(r.userId)}>
										<UserPlus size={11} />
										{t('network.connect')}
									</Button>
								{/if}
							{/snippet}
						</UserCard>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
