/**
 * Local domain types for the Messages feature, narrowed straight from the
 * api-client chat DTOs so the UI layer never re-declares the backend shape
 * (single source of truth = the Kubb-generated SDK).
 */

import type {
  GetV1ChatConversationsConversationIdMessagesQueryResponse,
  GetV1ChatConversationsQueryResponse,
  GetV1ChatUsersSearchQueryResponse,
} from "@patch-careers/api-client";

/** One row in the inbox (`GET /chat/conversations`). */
export type Conversation = GetV1ChatConversationsQueryResponse["items"][number];

/** The "other side" of a conversation. */
export type ChatParticipant = Conversation["participant"];

/** One bubble in a thread (`GET /chat/conversations/:id/messages`). */
export type ChatMessage =
  GetV1ChatConversationsConversationIdMessagesQueryResponse["items"][number];

/** A user surfaced by the people search (`GET /chat/users/search`). */
export type ChatUser = GetV1ChatUsersSearchQueryResponse["items"][number];
