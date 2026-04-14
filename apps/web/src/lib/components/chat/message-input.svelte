<script lang="ts">
	import { Button, Textarea } from 'ui';
	import { Send } from 'lucide-svelte';

	type Props = {
		disabled?: boolean;
		onsend: (content: string) => void;
	};

	let { disabled = false, onsend }: Props = $props();

	let content = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmed = content.trim();
		if (!trimmed) return;
		onsend(trimmed);
		content = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}
</script>

<div class="flex-shrink-0 border-t px-3 py-2 sm:px-4 sm:py-3 border-gray-100 dark:border-neutral-800">
	<form onsubmit={handleSubmit} class="flex items-end gap-2">
		<div class="flex-1 rounded-xl px-4 py-2.5 bg-gray-100 dark:bg-neutral-800">
			<Textarea
				bind:value={content}
				onkeydown={handleKeydown}
				{disabled}
				rows={1}
				placeholder="Type a message..."
				class="w-full resize-none bg-transparent text-[13px] leading-relaxed"
			/>
		</div>
		<Button
			type="submit"
			variant="solid"
			disabled={disabled || !content.trim()}
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-700 text-white {content.trim() ? 'scale-100' : 'opacity-30 scale-95'}"
		>
			<Send size={16} />
		</Button>
	</form>
</div>
