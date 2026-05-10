<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createPostV1UsersUserIdConnect,
  createGetV1UsersMeConnectionsSuggestions,
  getV1UsersMeConnectionsSuggestions,
  getV1UsersMeConnectionsSuggestionsQueryKey,
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
import { useInfiniteList } from '$lib/state/use-infinite-list.svelte';
import type { ConnectionSuggestion } from '$lib/types/social';

const t = $derived(locale.t);
const auth = useAuth();

const list = useInfiniteList<ConnectionSuggestion>({
  createQuery: (p) =>
    createGetV1UsersMeConnectionsSuggestions(p, {
      query: { enabled: browser && auth.isAuthenticated },
    }),
  fetcher: (p) => getV1UsersMeConnectionsSuggestions(p),
});

const queryClient = useQueryClient();

const connectMutation = createPostV1UsersUserIdConnect({
  mutation: {
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: getV1UsersMeConnectionsSuggestionsQueryKey(),
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
			{#if list.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">
					{list.total}
				</span>
			{/if}
		</header>

		{#if list.isLoading}
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
		{:else if list.items.length === 0}
			<EmptyState
				message={t('network.suggestionsEmpty')}
				icon={Users as unknown as Component<{ size: number; class?: string }>}
			/>
		{:else}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
				{#each list.items as suggestion (suggestion.id)}
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
				onLoadMore={list.loadMore}
				hasMore={list.hasMore}
				isLoading={list.loadingMore}
			/>
		{/if}
	</div>
</div>
