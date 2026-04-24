<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionSendConnectionRequest,
  getConnectionGetConnectionSuggestionsQueryKey,
} from 'api-client';
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-svelte';
import { Button, SliderCarousel, toastState } from 'ui';
import { track } from '$lib/analytics/track';
import { locale } from '$lib/state/locale.svelte';
import { sentConnections } from '$lib/state/sent-connections.svelte';
import UserCard from '$lib/components/user-card.svelte';

type Suggestion = {
  id: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
  reason?: string | null;
  mutualCount?: number;
  commonSkills?: string[];
};

type Props = {
  suggestions: Suggestion[];
  title?: string;
  seeAllHref?: string;
  source?: string;
  ondismiss?: (userId: string) => void;
};

let { suggestions, title, seeAllHref, source = 'suggestions', ondismiss }: Props = $props();

const t = $derived(locale.t);
const queryClient = useQueryClient();

const connectMutation = createConnectionSendConnectionRequest(() => ({
  mutation: {
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: getConnectionGetConnectionSuggestionsQueryKey(),
      });
      track('connection_requested', { targetUserId: variables.userId, source });
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
  ondismiss?.(userId);
}

function highlightFor(suggestion: Suggestion): string | undefined {
  const mutual = suggestion.mutualCount ?? 0;
  const commonSkills = suggestion.commonSkills ?? [];
  if (mutual > 0) return t('network.carouselMutualCount', { count: mutual });
  if (commonSkills.length > 0) {
    return t('network.carouselSkillsInCommon').replace(
      '{skills}',
      commonSkills.slice(0, 3).join(', '),
    );
  }
  return suggestion.reason ?? undefined;
}
</script>

{#if suggestions.length > 0}
	<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
		<div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
			<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
				{title ?? t('network.suggestions')}
			</h2>
			{#if seeAllHref}
				<a href={seeAllHref} class="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-300">
					{t('network.showAll')}
				</a>
			{/if}
		</div>

		<SliderCarousel
			items={suggestions}
			perView={3}
			keyFn={(s: Suggestion) => s.id}
			loadMoreLabel={t('network.loadMore')}
		>
			{#snippet prevIcon()}
				<ChevronLeft size={16} />
			{/snippet}
			{#snippet nextIcon()}
				<ChevronRight size={16} />
			{/snippet}
			{#snippet item(suggestion: Suggestion)}
				{@const commonSkills = suggestion.commonSkills ?? []}
				<UserCard
					user={{
						id: suggestion.id,
						name: suggestion.name ?? null,
						username: suggestion.username ?? null,
						photoURL: suggestion.photoURL ?? null,
					}}
					subtitle={highlightFor(suggestion)}
				>
					{#snippet actions()}
						{#if commonSkills.length > 0}
							<div class="mb-1 flex flex-wrap justify-center gap-1">
								{#each commonSkills.slice(0, 3) as skill}
									<span class="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-medium text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200">
										{skill}
									</span>
								{/each}
							</div>
						{/if}
						{#if sentConnections.has(suggestion.id)}
							<span
								class="w-full rounded-full border py-1.5 text-center text-[10px] font-semibold opacity-60 border-gray-300 text-gray-700 dark:border-neutral-600 dark:text-neutral-300"
							>
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
			{/snippet}
		</SliderCarousel>
	</section>
{/if}
