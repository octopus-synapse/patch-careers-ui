<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ColorSchema } from './types';

	type Align = 'left' | 'right';

	type Props = {
		open: boolean;
		align?: Align;
		colorSchema?: ColorSchema;
		onclose: () => void;
		trigger: Snippet;
		children: Snippet;
	};

	let { open, align = 'right', colorSchema = 'light', onclose, trigger, children }: Props = $props();

	const bg = { light: 'bg-white', dark: 'bg-neutral-800' };
	const border = { light: 'border-gray-200', dark: 'border-neutral-700' };
	const shadow = 'shadow-lg';

	const alignClass: Record<Align, string> = {
		left: 'left-0',
		right: 'right-0',
	};

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-dropdown-container]')) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	$effect(() => {
		if (open) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative inline-block" data-dropdown-container>
	{@render trigger()}

	{#if open}
		<div
			class="absolute z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border {bg[colorSchema]} {border[colorSchema]} {shadow} {alignClass[align]}"
			role="menu"
		>
			{@render children()}
		</div>
	{/if}
</div>
