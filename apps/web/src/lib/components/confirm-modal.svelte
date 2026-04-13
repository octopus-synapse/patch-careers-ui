<script lang="ts">
	import { Modal, Button } from 'ui';
	import { locale } from '$lib/locale.svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title?: string;
		message?: string;
		confirmLabel?: string;
		confirmVariant?: 'danger' | 'solid';
	};

	let {
		open,
		onClose,
		onConfirm,
		title = '',
		message = '',
		confirmLabel,
		confirmVariant = 'danger',
	}: Props = $props();

	const t = $derived(locale.t);
</script>

<Modal {open} {onClose}>
	{#snippet title()}
		{title}
	{/snippet}
	<p class="text-sm text-gray-500 dark:text-neutral-500 mb-4">{message}</p>
	<div class="flex justify-end gap-2">
		<Button variant="outline" size="sm" onclick={onClose}>
			{t('network.cancel')}
		</Button>
		<Button variant={confirmVariant} size="sm" onclick={onConfirm}>
			{confirmLabel ?? t('network.removeConfirmButton')}
		</Button>
	</div>
</Modal>
