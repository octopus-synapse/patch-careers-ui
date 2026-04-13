<script lang="ts">
	import { Modal, Button } from 'ui';
	import type { ColorSchema } from 'ui';

	type Props = {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		loading?: boolean;
		colorSchema?: ColorSchema;
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
		colorSchema = 'light',
		onconfirm,
		oncancel,
	}: Props = $props();

	const cs = $derived(colorSchema);
	const muted = $derived(cs === 'dark' ? 'text-neutral-400' : 'text-gray-500');
</script>

<Modal {open} onClose={oncancel} colorSchema={cs}>
	{#snippet title()}{title}{/snippet}
	<p class="mb-6 text-sm {muted}">{message}</p>
	<div class="flex gap-3">
		<div class="flex-1">
			<Button variant="outline" size="md" fullWidth onclick={oncancel} colorSchema={cs}>
				{cancelLabel}
			</Button>
		</div>
		<div class="flex-1">
			<Button variant="solid" size="md" fullWidth onclick={onconfirm} disabled={loading} colorSchema={cs}>
				{loading ? '...' : confirmLabel}
			</Button>
		</div>
	</div>
</Modal>
