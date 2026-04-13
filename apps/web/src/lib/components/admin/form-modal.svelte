<script lang="ts">
	import { Modal, Button } from 'ui';
	import type { ColorSchema } from 'ui';
	import type { Snippet } from 'svelte';
	import { Loader2 } from 'lucide-svelte';

	type Props = {
		open: boolean;
		title: string;
		loading?: boolean;
		submitLabel?: string;
		colorSchema?: ColorSchema;
		onsubmit: () => void;
		oncancel: () => void;
		children: Snippet;
	};

	let {
		open,
		title,
		loading = false,
		submitLabel = 'Save',
		colorSchema = 'light',
		onsubmit,
		oncancel,
		children,
	}: Props = $props();

	const cs = $derived(colorSchema);
	const muted = $derived(cs === 'dark' ? 'text-neutral-400' : 'text-gray-500');

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onsubmit();
	}
</script>

<Modal {open} onClose={oncancel} colorSchema={cs}>
	{#snippet title()}{title}{/snippet}
	<form onsubmit={handleSubmit} class="space-y-4">
		{@render children()}
		<div class="flex gap-3 pt-2">
			<div class="flex-1">
				<button
					type="button"
					onclick={oncancel}
					class="w-full rounded-full border py-2.5 text-xs font-bold uppercase tracking-widest transition-colors {cs === 'dark' ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}"
				>
					Cancel
				</button>
			</div>
			<div class="flex-1">
				<Button type="submit" disabled={loading} colorSchema={cs}>
					{#if loading}
						<Loader2 size={14} class="mx-auto animate-spin" />
					{:else}
						{submitLabel}
					{/if}
				</Button>
			</div>
		</div>
	</form>
</Modal>
