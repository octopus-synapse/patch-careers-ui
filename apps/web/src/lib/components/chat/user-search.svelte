<script lang="ts">
import { Search, X } from 'lucide-svelte';
import { Button, Input } from 'ui';
import UserSearchResults from './user-search-results.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

let { onselect }: { onselect: (userId: string) => void } = $props();

let query = $state('');
let debouncedQuery = $state('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
  const next = query;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => (debouncedQuery = next), 300);
  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
  };
});

function select(userId: string) {
  query = '';
  debouncedQuery = '';
  onselect(userId);
}
</script>

<div class="relative">
	<div class="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100 dark:bg-neutral-800">
		<Search size={13} class="text-gray-400 dark:text-neutral-500" />
		<Input type="text" bind:value={query} placeholder={t('chat.searchUsersPlaceholder')} />
		{#if query}
			<Button variant="icon" onclick={() => { query = ''; debouncedQuery = ''; }} class="opacity-50 hover:opacity-100">
				<X size={12} class="text-gray-400 dark:text-neutral-500" />
			</Button>
		{/if}
	</div>

	{#if debouncedQuery.length >= 2}
		<UserSearchResults q={debouncedQuery} onselect={select} />
	{/if}
</div>
