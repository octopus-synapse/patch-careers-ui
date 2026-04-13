<script lang="ts">
	import { Modal, Button } from 'ui';

	type Props = {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		loading?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	};

	let {
		open,
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		loading = false,
		onconfirm,
		oncancel,
	}: Props = $props();
</script>

<Modal {open} onClose={oncancel}>
	{#snippet title()}{title}{/snippet}
	<p class="mb-6 text-sm text-gray-500 dark:text-neutral-400">{message}</p>
	<div class="flex gap-3">
		<div class="flex-1">
			<Button variant="outline" size="md" fullWidth onclick={oncancel}>
				{cancelLabel}
			</Button>
		</div>
		<div class="flex-1">
			<Button variant="solid" size="md" fullWidth onclick={onconfirm} disabled={loading}>
				{loading ? '...' : confirmLabel}
			</Button>
		</div>
	</div>
</Modal>
