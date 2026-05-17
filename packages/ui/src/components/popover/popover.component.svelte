<script lang="ts">
import type { Snippet } from 'svelte';

type Placement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';

type Props = {
  open: boolean;
  onClose: () => void;
  placement?: Placement;
  /** aria-label for the dialog wrapper. Required for screen readers. */
  label: string;
  /** Max width in rem. Default 18rem (~288px). */
  widthRem?: number;
  /** Rendered inside the popover panel. */
  children: Snippet;
  /** Rendered as the trigger — must be a button-like element controlling `open`. */
  trigger: Snippet;
};

let { open, onClose, placement = 'bottom-end', label, widthRem = 18, children, trigger }: Props =
  $props();

let rootEl = $state<HTMLDivElement | null>(null);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open) {
    e.preventDefault();
    onClose();
  }
}

$effect(() => {
  if (!open) return;
  function onDocPointer(e: PointerEvent) {
    const target = e.target as Node | null;
    if (target && rootEl?.contains(target)) return;
    onClose();
  }
  document.addEventListener('pointerdown', onDocPointer);
  return () => document.removeEventListener('pointerdown', onDocPointer);
});

const placementClass = $derived(
  {
    'bottom-end': 'right-0 top-full mt-1',
    'bottom-start': 'left-0 top-full mt-1',
    'top-end': 'right-0 bottom-full mb-1',
    'top-start': 'left-0 bottom-full mb-1',
  }[placement],
);
</script>

<div bind:this={rootEl} class="relative inline-block" onkeydown={onKeydown} role="none">
	{@render trigger()}
	{#if open}
		<div
			role="dialog"
			tabindex="-1"
			aria-label={label}
			class="absolute z-20 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800 {placementClass}"
			style:width={`${widthRem}rem`}
		>
			{@render children()}
		</div>
	{/if}
</div>
