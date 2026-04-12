<script lang="ts">
	import type { ColorSchema } from './types';

	type Props = {
		name: string;
		colorSchema?: ColorSchema;
		size?: 'sm' | 'md';
	};

	let { name, colorSchema = 'light', size = 'sm' }: Props = $props();

	const initial = $derived(name.charAt(0).toUpperCase());
	const bg = { light: 'bg-gray-800 text-gray-50', dark: 'bg-neutral-200 text-neutral-900' };
	const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm' };
</script>

<div class="flex items-center justify-center rounded-full font-bold {bg[colorSchema]} {sizeClass[size]}">
	{initial}
</div>
