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
let matched = $derived(typed.trim() === confirmPhrase);

$effect(() => {
  if (!open) typed = '';
});

function handleConfirm() {
  if (!matched || loading) return;
  onConfirm();
}
</script>

<Modal {open} {onClose}>
	{#snippet title()}{title}{/snippet}
	<p class="mb-3 text-sm text-gray-600 dark:text-neutral-400">{message}</p>
	{#if warning}
		<p class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
			{warning}
		</p>
	{/if}
	<label class="mb-4 block text-xs font-medium text-gray-700 dark:text-neutral-300">
		Para confirmar, digite <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-900 dark:bg-neutral-800 dark:text-neutral-100">{confirmPhrase}</code>
		<Input
			value={typed}
			oninput={(e) => { typed = (e.currentTarget as HTMLInputElement).value; }}
			placeholder={confirmPhrase}
			class="mt-2 font-mono"
			disabled={loading}
			autofocus
		/>
	</label>
	<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<Button variant="outline" size="sm" onclick={onClose} disabled={loading}>
			{cancelLabel}
		</Button>
		<Button
			variant="solid"
			intent="danger"
			size="sm"
			onclick={handleConfirm}
			disabled={!matched || loading}
		>
			{confirmLabel}
		</Button>
	</div>
</Modal>
