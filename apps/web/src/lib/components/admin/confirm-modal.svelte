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
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-400' : 'text-gray-500');
</script>

<Modal {open} onClose={oncancel} colorSchema={cs}>
	{#snippet title()}{title}{/snippet}
	<p class="mb-6 text-sm {muted}">{message}</p>
	<div class="flex gap-3">
		<div class="flex-1">
			<button
				onclick={oncancel}
				class="w-full rounded-full border py-2.5 text-xs font-bold uppercase tracking-widest transition-colors {cs === 'dark' ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}"
			>
				{cancelLabel}
			</button>
		</div>
		<div class="flex-1">
			<Button onclick={onconfirm} disabled={loading} colorSchema={cs}>
				{loading ? '...' : confirmLabel}
			</Button>
		</div>
	</div>
</Modal>
