<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';

type Props = Omit<HTMLInputAttributes, 'type' | 'size' | 'value' | 'group'> & {
  value: string;
  group?: string;
  label?: string;
  description?: string;
  children?: Snippet;
  size?: 'sm' | 'md';
};

let {
  value,
  group = $bindable(),
  label,
  description,
  children,
  size = 'md',
  disabled,
  id,
  class: className = '',
  ...rest
}: Props = $props();

const boxSize = $derived({ sm: 'h-3.5 w-3.5', md: 'h-4 w-4' }[size]);
</script>

<label
	class="inline-flex items-start gap-2 {disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} {typeof className === 'string' ? className : ''}"
	for={id}
>
	<input
		bind:group
		{id}
		{value}
		type="radio"
		{disabled}
		class="{boxSize} mt-0.5 shrink-0 border-gray-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500 dark:border-neutral-600 dark:bg-neutral-800"
		{...rest}
	/>
	{#if children}
		{@render children()}
	{:else if label || description}
		<span class="min-w-0 flex-1 text-sm text-gray-800 dark:text-neutral-200">
			{#if label}<span class="block font-medium">{label}</span>{/if}
			{#if description}<span class="mt-0.5 block text-xs text-gray-500 dark:text-neutral-400">{description}</span>{/if}
		</span>
	{/if}
</label>
