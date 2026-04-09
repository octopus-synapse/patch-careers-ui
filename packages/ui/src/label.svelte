<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { ColorSchema } from './types';

	type Props = HTMLLabelAttributes & {
		colorSchema?: ColorSchema;
		children: Snippet;
	};

	const styles: Record<ColorSchema, string> = {
		light: 'text-gray-500',
		dark: 'text-neutral-500'
	};

	let { colorSchema = 'light', children, class: className = '', ...rest }: Props = $props();
</script>

<label
	class="text-[10px] font-bold uppercase tracking-widest {styles[colorSchema]} {className}"
	{...rest}
>
	{@render children()}
</label>
