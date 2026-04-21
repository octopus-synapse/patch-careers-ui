<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionSendConnectionRequest,
  getConnectionGetConnectionSuggestionsQueryKey,
} from 'api-client';
import { UserPlus } from 'lucide-svelte';
import { Button, toastState } from 'ui';
import { track } from '$lib/analytics/track';
import { locale } from '$lib/state/locale.svelte';
import { sentConnections } from '$lib/network/sent-connections.svelte';
import UserCard from '../user-card.svelte';

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
  /** Link displayed as "See all" on the right. Omit to hide. */
  seeAllHref?: string;
  /** Analytics source tag. */
  source?: string;
  /** Called when user dismisses a card locally (e.g. after Connect). */
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
		<div class="flex gap-3 overflow-x-auto px-3 py-3 sm:px-5 sm:py-4 sm:gap-4 snap-x scroll-smooth">
			{#each suggestions as suggestion (suggestion.id)}
				{@const mutual = suggestion.mutualCount ?? 0}
				{@const commonSkills = suggestion.commonSkills ?? []}
				{@const highlight =
					mutual > 0
						? mutual === 1
							? '1 conexão em comum'
							: `${mutual} conexões em comum`
						: commonSkills.length > 0
							? `Skills em comum: ${commonSkills.slice(0, 3).join(', ')}`
							: (suggestion.reason ?? undefined)}
				<div class="w-48 flex-shrink-0 snap-start">
					<UserCard
						user={{
							id: suggestion.id,
							name: suggestion.name ?? null,
							username: suggestion.username ?? null,
							photoURL: suggestion.photoURL ?? null,
						}}
						subtitle={highlight}
					>
						{#snippet actions()}
							{#if commonSkills.length > 0 && mutual > 0}
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
								<Button variant="solid" size="sm" fullWidth onclick={() => handleConnect(suggestion.id)}>
									<UserPlus size={11} />
									{t('network.connect')}
								</Button>
							{/if}
						{/snippet}
					</UserCard>
				</div>
			{/each}
		</div>
	</section>
{/if}
