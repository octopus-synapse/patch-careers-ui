<script lang="ts">
import type { Snippet } from 'svelte';

type Align = 'left' | 'right';

type Props = {
  open: boolean;
  align?: Align;
  onclose: () => void;
  trigger: Snippet;
  children: Snippet;
};

let { open, align = 'right', onclose, trigger, children }: Props = $props();

const alignClass: Record<Align, string> = {
  left: 'left-0',
  right: 'right-0',
};

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-dropdown-container]')) {
    onclose();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') onclose();
}

$effect(() => {
  if (open) {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative inline-block" data-dropdown-container>
	{@render trigger()}

	{#if open}
		<div
			class="absolute z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border shadow-lg bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700 {alignClass[align]}"
			role="menu"
		>
			{@render children()}
		</div>
	{/if}
</div>
