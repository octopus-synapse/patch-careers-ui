<script lang="ts">
import Button from './button.svelte';
import type { IntentKey } from './design';
import Modal from './modal.svelte';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIntent?: IntentKey;
  loading?: boolean;
};

let {
  open,
  onClose,
  onConfirm,
  title = '',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmIntent = 'danger',
  loading = false,
}: Props = $props();
</script>

<Modal {open} {onClose}>
	{#snippet title()}{title}{/snippet}
	<p class="text-sm text-gray-500 dark:text-neutral-500 mb-4">{message}</p>
	<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<Button variant="outline" size="sm" onclick={onClose} disabled={loading}>{cancelLabel}</Button>
		<Button variant="solid" intent={confirmIntent} size="sm" onclick={onConfirm} disabled={loading}>{confirmLabel}</Button>
	</div>
</Modal>
