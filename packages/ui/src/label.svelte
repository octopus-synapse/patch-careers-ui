<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLLabelAttributes } from 'svelte/elements';
import { neutralMutedText } from './neutral-classes';

type Props = HTMLLabelAttributes & {
  children: Snippet;
};

let { children, class: className = '', ...rest }: Props = $props();
</script>

<label
	class="text-[10px] font-bold uppercase tracking-widest {neutralMutedText} {className}"
	{...rest}
>
	{@render children()}
</label>
