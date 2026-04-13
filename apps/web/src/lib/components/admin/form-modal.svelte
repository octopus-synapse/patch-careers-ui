<script lang="ts">
	import { Modal, Button } from 'ui';
	import type { Snippet } from 'svelte';
	import { Loader2 } from 'lucide-svelte';

	type Props = {
		open: boolean;
		title: string;
		loading?: boolean;
		submitLabel?: string;
		onsubmit: () => void;
		oncancel: () => void;
		children: Snippet;
	};

	let {
		open,
		title,
		loading = false,
		submitLabel = 'Save',
		onsubmit,
		oncancel,
		children,
	}: Props = $props();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onsubmit();
	}
</script>

<Modal {open} onClose={oncancel}>
	{#snippet title()}{title}{/snippet}
	<form onsubmit={handleSubmit} class="space-y-4">
		{@render children()}
		<div class="flex gap-3 pt-2">
			<div class="flex-1">
				<Button type="button" variant="outline" size="md" fullWidth onclick={oncancel}>
					Cancel
				</Button>
			</div>
			<div class="flex-1">
				<Button type="submit" variant="solid" size="md" fullWidth disabled={loading}>
					{#if loading}
						<Loader2 size={14} class="animate-spin" />
					{:else}
						{submitLabel}
					{/if}
				</Button>
			</div>
		</div>
	</form>
</Modal>
