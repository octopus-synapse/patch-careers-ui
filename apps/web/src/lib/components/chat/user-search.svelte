<script lang="ts">
import { createGetV1ChatUsersSearch } from 'api-client';
import { Search, X } from 'lucide-svelte';
import { Avatar, Button, Input } from 'ui';

let { onselect }: { onselect: (userId: string) => void } = $props();

let query = $state('');
let debouncedQuery = $state('');
let showDropdown = $state(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
  const next = query;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => (debouncedQuery = next), 300);
  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
  };
});

const search = createGetV1ChatUsersSearch(
  { q: debouncedQuery },
  { query: { enabled: debouncedQuery.length >= 2, retry: false, refetchOnWindowFocus: false } },
);

const results = $derived($search.data?.users ?? []);

$effect(() => {
  showDropdown = results.length > 0 && debouncedQuery.length >= 2;
});

function select(userId: string) {
  query = '';
  debouncedQuery = '';
  showDropdown = false;
  onselect(userId);
}
</script>

<div class="relative">
	<div class="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100 dark:bg-neutral-800">
		<Search size={13} class="text-gray-400 dark:text-neutral-500" />
		<Input type="text" bind:value={query} placeholder="Search users..." />
		{#if query}
			<Button variant="icon" onclick={() => { query = ''; debouncedQuery = ''; showDropdown = false; }} class="opacity-50 hover:opacity-100">
				<X size={12} class="text-gray-400 dark:text-neutral-500" />
			</Button>
		{/if}
	</div>

	{#if showDropdown}
		<div class="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg bg-white border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
			{#each results as user}
				<button
					onclick={() => select(user.id)}
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
</div>
