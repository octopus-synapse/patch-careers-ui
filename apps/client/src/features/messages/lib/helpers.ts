/**
 * Pure helpers for the Messages feature — time formatting, participant
 * labelling and the message-grouping logic that decides when a bubble starts
 * a new visual run and when to paint the sender avatar.
 *
 * Kept free of React/Tamagui so the branching is unit-testable (the JSX that
 * consumes it is exercised at the app E2E layer). `now` is always injected so
 * the time helpers stay deterministic.
 */

import type { Translator } from "@patch-careers/i18n";
import { timeAgo as sharedTimeAgo } from "@/lib/time-ago";
import type { ChatMessage, ChatParticipant, ChatUser } from "../types";

/** Best human label for a participant or a people-search result. */
export function participantLabel(
  person: Pick<ChatParticipant, "name" | "username"> | Pick<ChatUser, "name" | "username">,
  t: Translator,
): string {
  return person.name ?? person.username ?? t("messages.userFallback");
}

/**
 * Compact "time ago" label for the inbox (agora / 5m / 3h / 2d). Thin wrapper
 * over the shared `@/lib/time-ago` helper with this feature's i18n namespace.
 */
export function timeAgo(dateStr: string | null | undefined, now: number, t: Translator): string {
  return sharedTimeAgo(dateStr, now, t, "messages.timeAgo");
}

/** Clock label ("14:32") shown under a message bubble. */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Oldest-first ordering — the API may page newest-first, the thread renders old→new. */
export function sortMessagesAsc(messages: readonly ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export type RenderedMessage = {
  message: ChatMessage;
  /** Sent by the signed-in user → right-aligned, tinted bubble. */
  own: boolean;
  /** First bubble of a same-sender run → gets extra top spacing. */
  startsGroup: boolean;
  /** Last incoming bubble of a run → carries the sender avatar. */
  showAvatar: boolean;
};

/**
 * Annotate an ascending message list with grouping flags so consecutive
 * bubbles from the same sender hug together and only the trailing incoming
 * bubble of each run shows an avatar (WhatsApp/iMessage style).
 */
export function buildRenderList(
  messages: readonly ChatMessage[],
  currentUserId: string,
): RenderedMessage[] {
  return messages.map((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const own = message.senderId === currentUserId;
    const startsGroup = !prev || prev.senderId !== message.senderId;
    const endsGroup = !next || next.senderId !== message.senderId;
    return { message, own, startsGroup, showAvatar: !own && endsGroup };
  });
}
