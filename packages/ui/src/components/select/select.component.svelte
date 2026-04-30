<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLSelectAttributes } from 'svelte/elements';

type Props = Omit<HTMLSelectAttributes, 'value'> & {
  value?: string | number;
  children: Snippet;
};

let { value = $bindable(''), class: className = '', children, ...rest }: Props = $props();
</script>

<select
	bind:value
	class="w-full rounded-lg border bg-white border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-cyan-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 {typeof className === 'string' ? className : ''}"
	{...rest}
>
	{@render children()}
</select>
