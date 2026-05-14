<script lang="ts">
import type { Snippet } from 'svelte';
import { tick, untrack } from 'svelte';
import Button from '../button/button.component.svelte';
import { focusTrap } from './modal.focus-trap';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type Props = {
  open: boolean;
  onClose: () => void;
  children: Snippet;
  title?: Snippet;
  /** Localized aria-label for the close button. Defaults to "Close". */
  closeLabel?: string;
  /** Max-width cap. Defaults to `md` (448 px). */
  size?: ModalSize;
  /** Pad the body (`px-4/5 py-3/4`). Defaults to true. Set false when
   *  the child renders its own header/body/footer chrome. */
  padded?: boolean;
};

let {
  open,
  onClose,
  children,
  title,
  closeLabel = 'Close',
  size = 'md',
  padded = true,
}: Props = $props();

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

// Stable id so aria-labelledby can point at the title even when the
// title content is dynamic. Generated once per Modal instance.
const titleId = `modal-title-${Math.random().toString(36).slice(2, 10)}`;

let dialogEl = $state<HTMLDivElement | null>(null);
let lastFocused = $state<HTMLElement | null>(null);

// On open: remember what had focus, hand focus to the dialog after the
// next tick so the element exists. On close: restore focus to the trigger
// so the user lands back where they started — critical for keyboard and
// screen-reader users.
$effect(() => {
  if (!open) {
    untrack(() => {
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
      lastFocused = null;
    });
    return;
  }
  if (typeof document !== 'undefined') {
    const active = document.activeElement;
    lastFocused = active instanceof HTMLElement ? active : null;
  }
  void tick().then(() => {
    if (dialogEl) dialogEl.focus();
  });
});

function handleKeydown(e: KeyboardEvent) {
  if (!open) return;
  if (e.key === 'Escape') onClose();
}

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) onClose();
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		bind:this={dialogEl}
		use:focusTrap={{ active: open }}
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-6"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? titleId : undefined}
		tabindex="-1"
	>
		<div class="w-full max-w-[calc(100vw-1.5rem)] {SIZE_CLASS[size]} rounded-2xl bg-white dark:bg-neutral-800 max-h-[90vh] overflow-y-auto">
			{#if title}
				<div class="flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4 border-gray-200 dark:border-neutral-700">
					<div id={titleId} class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
						{@render title()}
					</div>
					<Button variant="icon" size="sm" onclick={onClose} aria-label={closeLabel}>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					</Button>
				</div>
			{/if}
			<div class={padded ? 'px-4 py-3 sm:px-5 sm:py-4' : ''}>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
