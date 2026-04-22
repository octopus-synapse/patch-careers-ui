<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  connectionGetConnectionSuggestions,
  createConnectionGetConnectionSuggestions,
  createConnectionSendConnectionRequest,
  getConnectionGetConnectionSuggestionsQueryKey,
} from 'api-client';
import { UserPlus, Users } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import UserCard from '$lib/components/user-card.svelte';
import { locale } from '$lib/state/locale.svelte';
import { sentConnections } from '$lib/network/sent-connections.svelte';
import InfiniteScrollTrigger from '$lib/components/data/infinite-scroll-trigger.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

const query = createConnectionGetConnectionSuggestions(
  () => ({ page: 1, limit: 20 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

type Suggestion = {
  id: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
  reason?: string | null;
};

type PagedSection = {
  data: Suggestion[];
  totalPages: number;
  total: number;
};

function extractSuggestions(data: unknown): PagedSection {
  const outer = data as Record<string, unknown> | undefined;
  const section = outer?.suggestions as Record<string, unknown> | undefined;
  return {
    data: (section?.data as Suggestion[]) ?? [],
    totalPages: (section?.totalPages as number | undefined) ?? 0,
    total: (section?.total as number | undefined) ?? 0,
  };
}

const firstPage = $derived(extractSuggestions(query.data));
let extra = $state<Suggestion[]>([]);
let pageNum = $state(1);
let loadingMore = $state(false);

async function loadMore() {
  if (loadingMore) return;
  loadingMore = true;
  try {
    const next = pageNum + 1;
    const res = await connectionGetConnectionSuggestions({ page: next, limit: 20 });
    const section = extractSuggestions(res);
    extra = [...extra, ...section.data];
    pageNum = next;
  } finally {
    loadingMore = false;
  }
}

const all = $derived([...firstPage.data, ...extra]);

const queryClient = useQueryClient();

const connectMutation = createConnectionSendConnectionRequest(() => ({
  mutation: {
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: getConnectionGetConnectionSuggestionsQueryKey(),
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
}));

function handleConnect(userId: string) {
  sentConnections.add(userId);
  connectMutation.mutate({ userId });
}

// Skill-overlap recommendations — distinct from the generic "suggestions"
// endpoint. Pulled in parallel so the page has both a friend-of-friend list
// AND a "people who share your skills" list, ranked separately.
interface SkillRec {
  userId: string;
  name: string | null;
  username: string | null;
  sharedSkills: string[];
  overlapScore: number;
}

let skillRecs = $state<SkillRec[]>([]);
let skillRecsLoading = $state(true);

$effect(() => {
  if (!browser || !authenticated) return;
  fetch('/api/v1/users/me/connection-recommendations?limit=10', { credentials: 'include' })
    .then((r) => r.json())
    .then(
      (body: { data?: { recommendations?: SkillRec[] } }) =>
        (skillRecs = body.data?.recommendations ?? []),
    )
    .catch(() => {})
    .finally(() => (skillRecsLoading = false));
});
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
			{#if firstPage.total > 0}
				<span class="text-xs text-gray-500 dark:text-neutral-500">
					{firstPage.total}
				</span>
			{/if}
		</header>

		{#if query.isLoading}
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
					{@const userId = String(suggestion.id ?? '')}
					<UserCard
						user={{
							id: userId,
							name: suggestion.name,
							username: suggestion.username,
							photoURL: suggestion.photoURL,
						}}
						subtitle={suggestion.reason ?? undefined}
					>
						{#snippet actions()}
							{#if sentConnections.has(userId)}
								<span class="w-full rounded-full border py-1.5 text-center text-[10px] font-semibold opacity-60 border-gray-300 text-gray-700 dark:border-neutral-600 dark:text-neutral-300">
									{t('network.requestSent')}
								</span>
							{:else}
								<Button variant="solid" size="sm" fullWidth onclick={() => handleConnect(userId)}>
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
				hasMore={pageNum < firstPage.totalPages}
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
		{:else if skillRecs.length > 0}
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
									<Button variant="solid" size="sm" fullWidth onclick={() => handleConnect(r.userId)}>
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
