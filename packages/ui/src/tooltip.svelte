<script lang="ts">
	import type { Snippet } from 'svelte';

	type Position = 'top' | 'bottom' | 'left' | 'right';

	type Props = {
		text: string;
		position?: Position;
		children: Snippet;
	};

	let { text, position = 'top', children }: Props = $props();

	let visible = $state(false);

	const positionClass: Record<Position, string> = {
		top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 -translate-y-1/2 ml-2',
	};

	const arrowClass: Record<Position, string> = {
		top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 dark:border-t-neutral-200 border-x-transparent border-b-transparent border-4',
		bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 dark:border-b-neutral-200 border-x-transparent border-t-transparent border-4',
		left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 dark:border-l-neutral-200 border-y-transparent border-r-transparent border-4',
		right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 dark:border-r-neutral-200 border-y-transparent border-l-transparent border-4',
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative inline-flex"
	onmouseenter={() => visible = true}
	onmouseleave={() => visible = false}
	onfocusin={() => visible = true}
	onfocusout={() => visible = false}
>
	{@render children()}

	{#if visible}
		<div
			class="pointer-events-none absolute z-50 whitespace-nowrap rounded px-2 py-1 text-[10px] font-medium bg-gray-800 text-gray-50 dark:bg-neutral-200 dark:text-neutral-900 {positionClass[position]}"
			role="tooltip"
		>
			{text}
			<div class="absolute {arrowClass[position]}"></div>
		</div>
	{/if}
</div>
