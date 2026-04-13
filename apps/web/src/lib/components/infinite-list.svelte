<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		items: unknown[];
		hasMore: boolean;
		loading: boolean;
		loadingMore?: boolean;
		onLoadMore: () => void;
		renderItem: Snippet<[unknown, number]>;
		skeleton?: Snippet;
		emptyMessage?: string;
		dividerClass?: string;
	};

	let {
		items,
		hasMore,
		loading,
		loadingMore = false,
		onLoadMore,
		renderItem,
		skeleton,
		emptyMessage = '',
		dividerClass = 'divide-y divide-gray-200 dark:divide-neutral-800',
	}: Props = $props();

	let sentinel: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && hasMore && !loadingMore) onLoadMore();
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

{#if loading}
	{#if skeleton}
		{@render skeleton()}
	{:else}
		<div class="divide-y divide-gray-200 dark:divide-neutral-800">
			{#each Array(3) as _}
				<div class="flex items-center gap-3 px-5 py-3.5 animate-pulse">
					<div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
					<div class="flex-1 space-y-2">
						<div class="h-3 w-32 rounded bg-gray-200 dark:bg-neutral-700"></div>
						<div class="h-2 w-20 rounded bg-gray-200 dark:bg-neutral-700"></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else if items.length === 0}
	{#if emptyMessage}
		<p class="py-12 text-center text-sm text-gray-500 dark:text-neutral-500">{emptyMessage}</p>
	{/if}
{:else}
	<div class={dividerClass}>
		{#each items as item, index}
			{@render renderItem(item, index)}
		{/each}
	</div>
	{#if hasMore}
		<div bind:this={sentinel} class="h-1"></div>
	{/if}
{/if}
