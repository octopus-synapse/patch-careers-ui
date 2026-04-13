<script lang="ts">
	import Modal from './modal.svelte';
	import Button from './button.svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		confirmVariant?: 'solid' | 'danger';
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
		confirmVariant = 'danger',
		loading = false,
	}: Props = $props();
</script>

<Modal {open} {onClose}>
	{#snippet title()}{title}{/snippet}
	<p class="text-sm text-gray-500 dark:text-neutral-500 mb-4">{message}</p>
	<div class="flex justify-end gap-2">
		<Button variant="outline" size="sm" onclick={onClose} disabled={loading}>{cancelLabel}</Button>
		<Button variant={confirmVariant} size="sm" onclick={onConfirm} disabled={loading}>{confirmLabel}</Button>
	</div>
</Modal>
