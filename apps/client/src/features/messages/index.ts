/**
 * Messages feature — public API. The inbox + conversation-thread experience
 * (editorial chat) consumed by the messages and conversation routes. Import
 * only from "@/features/messages"; internal paths are private.
 */
export { ChatHeader } from "./components/chat-header";
export { ConversationListSkeleton } from "./components/conversation-list-skeleton";
export { ConversationRow } from "./components/conversation-row";
export { MessageBubble } from "./components/message-bubble";
export { MessageComposer } from "./components/message-composer";
export { UserResultRow } from "./components/user-result-row";
export { UserSearchField } from "./components/user-search-field";
export {
  lookupConversationWithUser,
  useConversationThread,
  useInbox,
  useUserSearch,
} from "./hooks/queries";
export { buildRenderList, participantLabel } from "./lib/helpers";
export type { ChatUser, Conversation } from "./types";
