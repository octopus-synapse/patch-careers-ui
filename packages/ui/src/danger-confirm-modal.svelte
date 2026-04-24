<script lang="ts">
/**
 * DangerConfirmModal
 *
 * Two-step confirmation for truly destructive actions (delete account,
 * drop resume, wipe data). User must type the exact `confirmPhrase` string
 * to unlock the confirm button — kills accidental clicks even in rapid
 * muscle-memory flows.
 *
 * Use for actions where "are you sure?" is not enough. For ordinary
 * deletes (post, comment, bookmark), prefer the optimistic + `undoableAction`
 * pattern instead — user experience >> paranoia there.
 */
import Button from './button.svelte';
import Input from './input.svelte';
import Modal from './modal.svelte';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Exact string the user must type to unlock confirm. Default: "DELETAR". */
  confirmPhrase?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Optional extra warning below the message (appears in danger color). */
  warning?: string;
};

let {
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmPhrase = 'DELETAR',
  confirmLabel = 'Confirmar exclusão',
  cancelLabel = 'Cancelar',
  loading = false,
  warning,
}: Props = $props();

let typed = $state('');
let matched = $derived(typed.trim().toLowerCase() === confirmPhrase.toLowerCase());
const inputId = `danger-confirm-${Math.random().toString(36).slice(2, 10)}`;

$effect(() => {
  if (!open) typed = '';
});

function handleConfirm() {
  if (!matched || loading) return;
  onConfirm();
}
</script>

<Modal {open} {onClose}>
	<div class="-mx-4 -my-3 sm:-mx-5 sm:-my-4">
		<!-- Custom header: danger icon + title + close -->
		<div class="relative flex items-start gap-3 px-5 pt-5 pb-4">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600 dark:text-red-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
			</div>
			<div class="min-w-0 flex-1 pt-1">
				<h2 class="text-base font-semibold text-gray-900 dark:text-neutral-100">{title}</h2>
				<p class="mt-1 text-sm text-gray-600 dark:text-neutral-400">{message}</p>
			</div>
			<button
				type="button"
				aria-label="Close"
				onclick={onClose}
				disabled={loading}
				class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
		</div>

		{#if warning}
			<div class="mx-5 mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
				{warning}
			</div>
		{/if}

		<!-- Confirm input -->
		<div class="px-5 pb-5">
			<label for={inputId} class="block text-xs font-medium text-gray-600 dark:text-neutral-400">
				Para confirmar, digite
				<code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-gray-900 dark:bg-neutral-700 dark:text-neutral-100">{confirmPhrase}</code>
			</label>
			<Input
				id={inputId}
				value={typed}
				oninput={(e) => {
					typed = (e.currentTarget as HTMLInputElement).value;
				}}
				placeholder={confirmPhrase}
				class={`mt-2 font-mono ${matched ? 'border-red-500 ring-1 ring-red-500/30 dark:border-red-400' : ''}`}
				disabled={loading}
				autofocus
			/>
		</div>

		<!-- Footer with subtle muted background to separate actions -->
		<div class="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-neutral-700 dark:bg-neutral-900/40 sm:flex-row sm:justify-end">
			<Button variant="ghost" size="sm" textCase="normal" onclick={onClose} disabled={loading}>
				{cancelLabel}
			</Button>
			<Button
				variant="solid"
				intent="danger"
				size="md"
				textCase="normal"
				onclick={handleConfirm}
				disabled={!matched || loading}
			>
				{confirmLabel}
			</Button>
		</div>
	</div>
</Modal>
