<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = Omit<HTMLTextareaAttributes, 'value'> & {
		value?: string;
	};

	let { value = $bindable(''), class: className = '', ...rest }: Props = $props();
</script>

<textarea
	bind:value
	class="w-full resize-none rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all border-gray-300 text-gray-900 placeholder:text-gray-500/50 focus:border-gray-900 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder:text-neutral-500/50 dark:focus:border-neutral-200 {className}"
	{...rest}
></textarea>
