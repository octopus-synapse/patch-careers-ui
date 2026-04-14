<script lang="ts">
	type Props = {
		onLoadMore: () => void;
		hasMore?: boolean;
		isLoading?: boolean;
	};

	let { onLoadMore, hasMore = false, isLoading = false }: Props = $props();
	let sentinel: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && hasMore && !isLoading) onLoadMore();
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

{#if hasMore}
	<div bind:this={sentinel} class="h-1"></div>
{/if}
