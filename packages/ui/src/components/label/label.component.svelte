<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLLabelAttributes } from 'svelte/elements';
import { neutralMutedText } from '../../shared/neutral-classes';

type Props = HTMLLabelAttributes & {
  children: Snippet;
  required?: boolean;
};

let { children, class: className = '', required = false, ...rest }: Props = $props();
</script>

<label
	class="text-xs font-medium {neutralMutedText} {className}"
	{...rest}
>
	{@render children()}
	{#if required}
		<span aria-hidden="true" class="ml-0.5 text-red-500">*</span>
	{/if}
</label>
