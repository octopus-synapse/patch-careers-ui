<script lang="ts">
	import { Modal, Button } from 'ui';
	import { Loader2 } from 'lucide-svelte';

	type Props = {
		open: boolean;
		onsubmit: (reason: string) => void;
		oncancel: () => void;
	};

	let { open, onsubmit, oncancel }: Props = $props();

	let reason = $state('');
	let submitting = $state(false);

	async function handleSubmit() {
		if (!reason.trim() || submitting) return;
		submitting = true;
		try {
			onsubmit(reason.trim());
			reason = '';
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		reason = '';
		oncancel();
	}
</script>

<Modal {open} onClose={handleCancel}>
	{#snippet title()}
		Report Post
	{/snippet}

	<div class="space-y-4">
		<p class="text-xs text-gray-400 dark:text-neutral-500">Why are you reporting this post?</p>
		<textarea
			class="w-full rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
			placeholder="Describe the reason..."
			rows="4"
			bind:value={reason}
		></textarea>

		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={handleCancel}>
				Cancel
			</Button>
			<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting || !reason.trim()}>
				{#if submitting}
					<Loader2 size={14} class="animate-spin" />
					Reporting...
				{:else}
					Report
				{/if}
			</Button>
		</div>
	</div>
</Modal>
