<script lang="ts">
import { createGetV1ChatUsersSearch } from 'api-client';
import { Avatar } from 'ui';

let { q, onselect }: { q: string; onselect: (userId: string) => void } = $props();

// Component only mounts when the parent decides the query is long enough
// (>= 2 chars). This sidesteps the Svelte 5 + TanStack svelte-query v5
// reactivity trap where `enabled: () => debouncedQuery.length >= 2` is
// captured into a one-shot `readable()` and never re-fires after the user
// types. Same pattern as feed-content.svelte and onboarding-stepper.svelte.
// svelte-ignore state_referenced_locally
const search = createGetV1ChatUsersSearch(
  { q },
  { query: { retry: false, refetchOnWindowFocus: false } },
);

const results = $derived($search.data?.items ?? []);
</script>

{#if results.length > 0}
	<div class="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg bg-white border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
		{#each results as user}
			<button
				onclick={() => onselect(user.id)}
				class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
			>
				<Avatar name={user.name ?? user.username ?? '?'} size="sm" />
				<div class="min-w-0 flex-1">
					<span class="block truncate text-xs font-semibold text-gray-800 dark:text-neutral-200">
						{user.name ?? user.username}
					</span>
					{#if user.username}
						<span class="block truncate text-[10px] text-gray-400 dark:text-neutral-500">@{user.username}</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{/if}
