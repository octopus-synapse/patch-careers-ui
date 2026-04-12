<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Send } from 'lucide-svelte';

	type Props = {
		colorSchema?: ColorSchema;
		disabled?: boolean;
		onsend: (content: string) => void;
	};

	let { colorSchema = 'light', disabled = false, onsend }: Props = $props();

	const inputBg = $derived(colorSchema === 'dark' ? 'bg-neutral-800' : 'bg-gray-100');
	const text = $derived(colorSchema === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-400');
	const border = $derived(colorSchema === 'dark' ? 'border-neutral-800' : 'border-gray-100');
	const sendBg = $derived(colorSchema === 'dark' ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white');

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

<div class="flex-shrink-0 border-t px-4 py-3 {border}">
	<form onsubmit={handleSubmit} class="flex items-end gap-2">
		<div class="flex-1 rounded-xl px-4 py-2.5 {inputBg}">
			<textarea
				bind:value={content}
				onkeydown={handleKeydown}
				{disabled}
				rows={1}
				placeholder="Type a message..."
				class="w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none {text} placeholder:{muted}"
			></textarea>
		</div>
		<button
			type="submit"
			disabled={disabled || !content.trim()}
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all
				{content.trim() ? sendBg + ' scale-100' : 'opacity-30 scale-95 ' + sendBg}"
		>
			<Send size={16} />
		</button>
	</form>
</div>
