<script lang="ts">
import { Send } from 'lucide-svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type Props = {
  disabled?: boolean;
  onsend: (content: string) => void;
};

let { disabled = false, onsend }: Props = $props();

let content = $state('');
let textarea: HTMLTextAreaElement | undefined = $state();

function autoresize() {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
}

function handleSubmit(e: Event) {
  e.preventDefault();
  const trimmed = content.trim();
  if (!trimmed) return;
  onsend(trimmed);
  content = '';
  queueMicrotask(autoresize);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
}

const canSend = $derived(!disabled && content.trim().length > 0);
</script>

<div class="flex-shrink-0 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 sm:px-4 sm:py-3">
	<form onsubmit={handleSubmit} class="flex items-end gap-2">
		<div class="flex-1 rounded-2xl bg-gray-100 dark:bg-neutral-800 px-3 py-2 ring-1 ring-transparent focus-within:ring-2 focus-within:ring-emerald-500/50 transition-shadow">
			<textarea
				bind:this={textarea}
				bind:value={content}
				oninput={autoresize}
				onkeydown={handleKeydown}
				{disabled}
				rows="1"
				placeholder={t('chat.messagePlaceholder')}
				class="block w-full resize-none border-0 bg-transparent text-sm leading-5 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-500 caret-emerald-600 dark:caret-emerald-400 outline-none focus:outline-none focus:ring-0"
			></textarea>
		</div>
		<button
			type="submit"
			disabled={!canSend}
			aria-label={t('chat.sendMessageAria')}
			class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white transition-all enabled:hover:bg-emerald-700 dark:enabled:hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed"
		>
			<Send size={16} />
		</button>
	</form>
</div>
