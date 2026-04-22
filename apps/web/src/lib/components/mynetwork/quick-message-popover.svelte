<script lang="ts">
import { chatSendMessage } from 'api-client';
import { MessageCircle, X } from 'lucide-svelte';
import { Button, Textarea, toastState } from 'ui';
import { track } from '$lib/analytics/track';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  recipientId: string;
  recipientName: string;
};

let { recipientId, recipientName }: Props = $props();

const t = $derived(locale.t);

let open = $state(false);
let content = $state('');
let sending = $state(false);
let popoverEl = $state<HTMLDivElement | null>(null);
let triggerEl = $state<HTMLButtonElement | null>(null);

function toggle() {
  open = !open;
  if (open) content = '';
}

function close() {
  open = false;
}

async function send() {
  const trimmed = content.trim();
  if (!trimmed || sending) return;
  sending = true;
  try {
    await chatSendMessage({ recipientId, content: trimmed });
    track('quick_message_sent', { recipientId, source: 'mynetwork_main' });
    toastState.show(t('network.quickMessageSent'), 'success');
    open = false;
    content = '';
  } catch {
    toastState.show(t('network.quickMessageError'), 'danger');
  } finally {
    sending = false;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
  else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    void send();
  }
}

$effect(() => {
  if (!open) return;
  function onDocClick(e: MouseEvent) {
    const target = e.target as Node;
    if (popoverEl?.contains(target) || triggerEl?.contains(target)) return;
    close();
  }
  document.addEventListener('mousedown', onDocClick);
  return () => document.removeEventListener('mousedown', onDocClick);
});
</script>

<div class="relative">
	<button
		bind:this={triggerEl}
		type="button"
		onclick={toggle}
		aria-expanded={open}
		aria-haspopup="dialog"
		class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
	>
		<MessageCircle size={12} />
		{t('network.message')}
	</button>

	{#if open}
		<div
			bind:this={popoverEl}
			role="dialog"
			tabindex="-1"
			aria-label={t('network.quickMessagePlaceholder')}
			class="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
			onkeydown={onKeydown}
		>
			<div class="mb-2 flex items-center justify-between">
				<span class="truncate text-xs font-semibold text-gray-700 dark:text-neutral-200">
					{recipientName}
				</span>
				<button
					type="button"
					aria-label="Close"
					onclick={close}
					class="flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
				>
					<X size={12} />
				</button>
			</div>
			<Textarea
				bind:value={content}
				placeholder={t('network.quickMessagePlaceholder')}
				rows={3}
				maxlength={5000}
			/>
			<div class="mt-2 flex items-center justify-end gap-2">
				<Button variant="ghost" size="xs" onclick={close}>
					{t('network.cancel')}
				</Button>
				<Button
					variant="solid"
					intent="accent"
					size="sm"
					disabled={!content.trim() || sending}
					onclick={send}
				>
					{t('network.quickMessageSend')}
				</Button>
			</div>
		</div>
	{/if}
</div>
