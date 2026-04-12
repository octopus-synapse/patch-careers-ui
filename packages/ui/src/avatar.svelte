<script lang="ts">
	import type { ColorSchema } from './types';

	type Props = {
		name: string;
		photoURL?: string | null;
		colorSchema?: ColorSchema;
		size?: 'sm' | 'md' | 'lg';
	};

	let { name, photoURL, colorSchema = 'light', size = 'sm' }: Props = $props();

	const initial = $derived(name.charAt(0).toUpperCase());
	const bg = { light: 'bg-gray-800 text-gray-50', dark: 'bg-neutral-200 text-neutral-900' };
	const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
	const imgSize = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
</script>

{#if photoURL}
	<img
		src={photoURL}
		alt={name}
		class="rounded-full object-cover {imgSize[size]}"
	/>
{:else}
	<div class="flex items-center justify-center rounded-full font-bold {bg[colorSchema]} {sizeClass[size]}">
		{initial}
	</div>
{/if}
