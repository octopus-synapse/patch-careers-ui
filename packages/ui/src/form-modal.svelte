<script lang="ts">
	import type { Snippet } from 'svelte';
	import Modal from './modal.svelte';
	import Button from './button.svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
		onSubmit: () => void;
		title?: string;
		submitLabel?: string;
		cancelLabel?: string;
		loading?: boolean;
		children: Snippet;
	};

	let {
		open,
		onClose,
		onSubmit,
		title = '',
		submitLabel = 'Save',
		cancelLabel = 'Cancel',
		loading = false,
		children,
	}: Props = $props();
</script>

<Modal {open} {onClose}>
	{#snippet title()}{title}{/snippet}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onSubmit();
		}}
		class="space-y-4"
	>
		{@render children()}
		<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
			<Button variant="outline" size="sm" onclick={onClose} disabled={loading} type="button">{cancelLabel}</Button>
			<Button variant="solid" size="sm" disabled={loading} type="submit">{submitLabel}</Button>
		</div>
	</form>
</Modal>
