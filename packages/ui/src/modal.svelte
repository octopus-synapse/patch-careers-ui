<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ColorSchema } from './types';

	type Props = {
		open: boolean;
		onClose: () => void;
		colorSchema?: ColorSchema;
		children: Snippet;
		title?: Snippet;
	};

	let { open, onClose, colorSchema = 'light', children, title }: Props = $props();

	const bg = { light: 'bg-white', dark: 'bg-neutral-800' };
	const text = { light: 'text-gray-800', dark: 'text-neutral-200' };
	const muted = { light: 'text-gray-500', dark: 'text-neutral-500' };
	const border = { light: 'border-gray-200', dark: 'border-neutral-700' };

	function handleKeydown(e: KeyboardEvent) {
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
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg {bg[colorSchema]}">
			{#if title}
				<div class="flex items-center justify-between border-b px-5 py-4 {border[colorSchema]}">
					<div class="text-sm font-semibold {text[colorSchema]}">
						{@render title()}
					</div>
					<button onclick={onClose} aria-label="Close" class="rounded-lg p-1 transition-opacity hover:opacity-60 {muted[colorSchema]}">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					</button>
				</div>
			{/if}
			<div class="px-5 py-4">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
