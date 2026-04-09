<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { ColorSchema } from './types';

	type Props = Omit<HTMLInputAttributes, 'value'> & {
		colorSchema?: ColorSchema;
		value?: string;
	};

	const styles: Record<ColorSchema, string> = {
		light: 'border-gray-300 text-gray-900 placeholder:text-gray-500/50 focus:border-gray-900',
		dark: 'border-neutral-700 text-neutral-200 placeholder:text-neutral-500/50 focus:border-neutral-200'
	};

	let { colorSchema = 'light', value = $bindable(''), class: className = '', ...rest }: Props = $props();
</script>

<input
	bind:value
	class="w-full rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all {styles[colorSchema]} {className}"
	{...rest}
/>
