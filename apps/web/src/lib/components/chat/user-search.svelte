<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Avatar } from 'ui';
	import { customFetch } from 'api-client/client';
	import { Search, X } from 'lucide-svelte';

	type SearchResult = {
		id: string;
		name: string | null;
		username: string | null;
		displayName: string | null;
		photoURL: string | null;
	};

	type Props = {
		colorSchema?: ColorSchema;
		onselect: (userId: string) => void;
	};

	let { colorSchema = 'light', onselect }: Props = $props();

	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-400');
	const inputBg = $derived(colorSchema === 'dark' ? 'bg-neutral-800' : 'bg-gray-100');
	const dropBg = $derived(colorSchema === 'dark' ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200');
	const hoverBg = $derived(colorSchema === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-gray-50');

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let showDropdown = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (query.length < 2) { results = []; showDropdown = false; return; }

		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
			try {
				const res = await customFetch<{ data: { data: { users: SearchResult[] } } }>(
					`/api/chat/users/search?q=${encodeURIComponent(query)}`
				);
				results = res.data?.data?.users ?? [];
				showDropdown = results.length > 0;
			} catch { results = []; }
		}, 300);

		return () => { if (debounceTimer) clearTimeout(debounceTimer); };
	});

	function select(userId: string) {
		query = ''; results = []; showDropdown = false;
		onselect(userId);
	}
</script>

<div class="relative">
	<div class="flex items-center gap-2 rounded-lg px-3 py-2 {inputBg}">
		<Search size={13} class={muted} />
		<input
			type="text"
			bind:value={query}
			placeholder="Search users..."
			class="flex-1 bg-transparent text-xs outline-none {text} placeholder:{muted}"
		/>
		{#if query}
			<button onclick={() => { query = ''; results = []; showDropdown = false; }} class="opacity-50 hover:opacity-100">
				<X size={12} class={muted} />
			</button>
		{/if}
	</div>

	{#if showDropdown}
		<div class="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg {dropBg}">
			{#each results as user}
				<button
					onclick={() => select(user.id)}
					class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors {hoverBg}"
				>
					<Avatar name={user.displayName ?? user.name ?? user.username ?? '?'} {colorSchema} size="sm" />
					<div class="min-w-0 flex-1">
						<span class="block truncate text-xs font-semibold {text}">
							{user.displayName ?? user.name ?? user.username}
						</span>
						{#if user.username}
							<span class="block truncate text-[10px] {muted}">@{user.username}</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
