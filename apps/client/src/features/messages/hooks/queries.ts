/**
 * React-Query glue for the Messages feature.
 *
 * Thin wrappers over the Kubb-generated chat hooks that centralise the bits
 * the screens shouldn't repeat: query enabling, light polling for liveness,
 * ascending message ordering, optimistic-ish cache invalidation after a send,
 * and the "open or create a conversation with a user" lookup.
 */

import {
  getV1ChatConversationsConversationIdMessagesQueryKey,
  getV1ChatConversationsQueryKey,
  getV1ChatConversationWithUserIdQueryOptions,
  getV1ChatUnreadQueryKey,
  useGetV1ChatConversations,
  useGetV1ChatConversationsConversationIdMessages,
  useGetV1ChatUsersSearch,
  usePostV1ChatConversationsConversationIdMessages,
  usePostV1ChatConversationsConversationIdRead,
  usePostV1ChatMessages,
} from "@patch-careers/api-client";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sortMessagesAsc } from "../lib/helpers";
import type { ChatMessage, ChatUser, Conversation } from "../types";

const INBOX_LIMIT = 50;
const THREAD_LIMIT = 100;
const INBOX_POLL_MS = 30_000;
const THREAD_POLL_MS = 12_000;

function inboxKey() {
  return getV1ChatConversationsQueryKey({ limit: INBOX_LIMIT });
}

function invalidateSidebars(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: inboxKey() });
  void qc.invalidateQueries({ queryKey: getV1ChatUnreadQueryKey() });
}

/** Inbox list — conversations sorted by the backend (most-recent first). */
export function useInbox(): {
  conversations: Conversation[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
} {
  const query = useGetV1ChatConversations(
    { limit: INBOX_LIMIT },
    { query: { refetchInterval: INBOX_POLL_MS } },
  );
  return {
    conversations: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}

/** Debounced people search — empty/short queries stay disabled. */
export function useUserSearch(term: string): { results: ChatUser[]; isLoading: boolean } {
  const enabled = term.trim().length >= 2;
  const query = useGetV1ChatUsersSearch(
    { q: term.trim() },
    { query: { enabled, staleTime: 10_000 } },
  );
  return {
    results: enabled ? (query.data?.items ?? []) : [],
    isLoading: enabled && query.isLoading,
  };
}

/**
 * Resolve an existing conversation with `userId`, or `null` when none exists
 * yet (the thread then opens in "new" mode and creates it on first send).
 */
export async function lookupConversationWithUser(
  qc: QueryClient,
  userId: string,
): Promise<string | null> {
  const res = await qc.fetchQuery(getV1ChatConversationWithUserIdQueryOptions(userId));
  return (res as { conversationId: string | null }).conversationId ?? null;
}

export type ConversationThread = {
  conversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  sending: boolean;
  send: (content: string) => void;
};

/**
 * Drives a single thread. Works in two modes:
 *   - existing conversation (`initialConversationId`) → load + send into it
 *   - new conversation (`recipientId`) → empty thread, first send creates it
 *     and we adopt the returned id so subsequent sends hit the conversation.
 */
export function useConversationThread(params: {
  initialConversationId: string | null;
  recipientId: string | null;
}): ConversationThread {
  const { initialConversationId, recipientId } = params;
  const qc = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);

  const messagesQuery = useGetV1ChatConversationsConversationIdMessages(
    conversationId ?? "",
    { limit: THREAD_LIMIT },
    { query: { enabled: Boolean(conversationId), refetchInterval: THREAD_POLL_MS } },
  );

  const messages = useMemo(
    () => sortMessagesAsc(messagesQuery.data?.items ?? []),
    [messagesQuery.data],
  );

  const sendToConversation = usePostV1ChatConversationsConversationIdMessages({
    mutation: {
      onSuccess: () => {
        if (conversationId) {
          void qc.invalidateQueries({
            queryKey: getV1ChatConversationsConversationIdMessagesQueryKey(conversationId, {
              limit: THREAD_LIMIT,
            }),
          });
        }
        invalidateSidebars(qc);
      },
    },
  });

  const sendToRecipient = usePostV1ChatMessages({
    mutation: {
      onSuccess: (res) => {
        setConversationId(res.message.conversationId);
        invalidateSidebars(qc);
      },
    },
  });

  const markRead = usePostV1ChatConversationsConversationIdRead();
  const markReadMutate = markRead.mutate;

  // Clear the unread badge as soon as we're viewing a real conversation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once per conversation id; mutate is stable.
  useEffect(() => {
    if (!conversationId) return;
    markReadMutate({ conversationId }, { onSuccess: () => invalidateSidebars(qc) });
  }, [conversationId]);

  const sending = sendToConversation.isPending || sendToRecipient.isPending;

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;
      if (conversationId) {
        sendToConversation.mutate({ conversationId, data: { content: trimmed } });
      } else if (recipientId) {
        sendToRecipient.mutate({ data: { recipientId, content: trimmed } });
      }
    },
    [conversationId, recipientId, sending, sendToConversation, sendToRecipient],
  );

  return {
    conversationId,
    messages,
    isLoading: Boolean(conversationId) && messagesQuery.isLoading,
    isError: messagesQuery.isError,
    refetch: () => void messagesQuery.refetch(),
    sending,
    send,
  };
}
