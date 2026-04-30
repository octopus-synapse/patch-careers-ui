<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';

type Props = Omit<HTMLInputAttributes, 'type' | 'checked' | 'size'> & {
  checked?: boolean;
  indeterminate?: boolean;
  /** Shorthand inline label rendered to the right of the box. */
  label?: string;
  /** Optional description rendered below the label. */
  description?: string;
  /** Overrides `label`/`description` when provided. */
  children?: Snippet;
  /** Visual size of the box. */
  size?: 'sm' | 'md';
};

let {
  checked = $bindable(false),
  indeterminate = false,
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

let inputEl = $state<HTMLInputElement | null>(null);
$effect(() => {
  if (inputEl) inputEl.indeterminate = indeterminate;
});
</script>

<label
	class="inline-flex items-start gap-2 {disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} {typeof className === 'string' ? className : ''}"
	for={id}
>
	<input
		bind:this={inputEl}
		bind:checked
		{id}
		type="checkbox"
		{disabled}
		class="{boxSize} mt-0.5 shrink-0 rounded border-gray-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500 dark:border-neutral-600 dark:bg-neutral-800"
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
