<script lang="ts">
import { chatMessages } from 'api-client';
import { MessageCircle, X } from 'lucide-svelte';
import { Button, Popover, Textarea, toastState } from 'ui';
import { track } from '$lib/utils/analytics/track';
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
    // POST /api/v1/chat/messages — kicks off (or reuses) a 1:1 conversation
    // and posts the first message in one round-trip.
    await chatMessages({ recipientId, content: trimmed });
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
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    void send();
  }
}
</script>

<Popover {open} onClose={close} label={t('network.quickMessagePlaceholder')} widthRem={18}>
	{#snippet trigger()}
		<Button variant="outline" intent="neutral" size="sm" textCase="normal" onclick={toggle}>
			<MessageCircle size={12} />
			{t('network.message')}
		</Button>
	{/snippet}

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
		onkeydown={onKeydown}
	/>
	<div class="mt-2 flex items-center justify-end gap-2">
		<Button variant="ghost" size="xs" textCase="normal" onclick={close}>
			{t('network.cancel')}
		</Button>
		<Button
			variant="solid"
			intent="accent"
			size="sm"
			textCase="normal"
			disabled={!content.trim() || sending}
			onclick={send}
		>
			{t('network.quickMessageSend')}
		</Button>
	</div>
</Popover>
