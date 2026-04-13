<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';

	type Props = HTMLLabelAttributes & {
		children: Snippet;
	};

	let { children, class: className = '', ...rest }: Props = $props();
</script>

<label
	class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500 {className}"
	{...rest}
>
	{@render children()}
</label>
