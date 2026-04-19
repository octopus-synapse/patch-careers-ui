<script lang="ts">
import type { Snippet } from 'svelte';

type Props = {
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  children: Snippet;
  loading?: Snippet;
  end?: Snippet;
  rootMargin?: string;
};

let {
  hasMore,
  isFetchingMore,
  onLoadMore,
  children,
  loading,
  end,
  rootMargin = '400px',
}: Props = $props();

let sentinel: HTMLDivElement | undefined = $state();

$effect(() => {
  if (!sentinel || !hasMore) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore && !isFetchingMore) {
        onLoadMore();
      }
    },
    { rootMargin },
  );

  observer.observe(sentinel);
  return () => observer.disconnect();
});
</script>

{@render children()}

<div bind:this={sentinel} aria-hidden="true" class="h-px w-full"></div>

{#if isFetchingMore && loading}
	{@render loading()}
{/if}

{#if !hasMore && end}
	{@render end()}
{/if}
