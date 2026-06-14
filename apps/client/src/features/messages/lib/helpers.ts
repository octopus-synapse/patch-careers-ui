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
import type { ChatMessage, ChatParticipant, ChatUser } from "../types";

/** Best human label for a participant or a people-search result. */
export function participantLabel(
  person: Pick<ChatParticipant, "name" | "username"> | Pick<ChatUser, "name" | "username">,
  t: Translator,
): string {
  return person.name ?? person.username ?? t("messages.userFallback");
}

/**
 * Compact "time ago" label for the inbox (agora / 5m / 3h / 2d), falling back
 * to a short date once the message is older than a week. Hand-rolled because
 * Hermes ships without Intl.RelativeTimeFormat; templates come from i18n.
 */
export function timeAgo(dateStr: string | null | undefined, now: number, t: Translator): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return t("messages.timeAgo.now");
  if (mins < 60) return t("messages.timeAgo.minutes", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("messages.timeAgo.hours", { n: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return t("messages.timeAgo.days", { n: days });
  return new Date(then).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
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
