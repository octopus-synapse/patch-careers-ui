<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1ChatConversationsConversationIdMessages,
  createPostV1ChatConversationsConversationIdMessages,
  getV1ChatConversationsConversationIdMessagesQueryKey,
  getV1ChatConversationsQueryKey,
} from 'api-client';
import MessageInput from './message-input.svelte';
import MessageThread from './message-thread.svelte';

/**
 * Mounted by chat-widget under `{#key conversationId}` — each conversation
 * switch destroys this component and instantiates a fresh one. That
 * sidesteps the Svelte 5 + TanStack svelte-query v5 trap where the
 * positional `conversationId` arg + `enabled: () => x` are captured into a
 * one-shot `readable()` at mount; without remount, switching threads
 * would keep fetching the original conversation's messages forever and
 * the newly-sent message wouldn't show because the invalidation key
 * doesn't match the captured key.
 */
let { conversationId, currentUserId }: { conversationId: string; currentUserId: string } = $props();

const queryClient = useQueryClient();

// `conversationId` is intentionally captured at mount — the parent
// re-mounts this component via `{#key conversationId}` on switch.
// svelte-ignore state_referenced_locally
const messages = createGetV1ChatConversationsConversationIdMessages(conversationId, { limit: 100 });

const msgList = $derived($messages.data?.items);

const sendMessage = createPostV1ChatConversationsConversationIdMessages({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: getV1ChatConversationsConversationIdMessagesQueryKey(conversationId, {
          limit: 100,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getV1ChatConversationsQueryKey({ limit: 50 }),
      });
    },
  },
});

function handleSend(content: string) {
  $sendMessage.mutate({ conversationId, data: { content } });
}
</script>

{#if msgList}
	<MessageThread messages={msgList} {currentUserId} />
{/if}
<MessageInput disabled={$sendMessage.isPending} onsend={handleSend} />
