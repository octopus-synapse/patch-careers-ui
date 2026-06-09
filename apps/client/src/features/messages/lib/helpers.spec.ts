import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../types";
import { buildRenderList, formatTime, participantLabel, sortMessagesAsc, timeAgo } from "./helpers";

function msg(
  over: Partial<ChatMessage> & Pick<ChatMessage, "id" | "senderId" | "createdAt">,
): ChatMessage {
  return {
    conversationId: "c1",
    content: "hi",
    isRead: false,
    readAt: null,
    sender: { id: over.senderId, name: null, photoURL: null },
    ...over,
  };
}

const NOW = new Date("2026-06-04T12:00:00.000Z").getTime();

describe("participantLabel", () => {
  it("prefers name, then username, then a fallback", () => {
    expect(participantLabel({ name: "Ada Lovelace", username: "ada" })).toBe("Ada Lovelace");
    expect(participantLabel({ name: null, username: "ada" })).toBe("ada");
    expect(participantLabel({ name: null, username: null })).toBe("Usuário");
  });
});

describe("timeAgo", () => {
  it("renders relative buckets up to a week", () => {
    expect(timeAgo(new Date(NOW - 30_000).toISOString(), NOW)).toBe("agora");
    expect(timeAgo(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe("5m");
    expect(timeAgo(new Date(NOW - 3 * 3_600_000).toISOString(), NOW)).toBe("3h");
    expect(timeAgo(new Date(NOW - 2 * 86_400_000).toISOString(), NOW)).toBe("2d");
  });

  it("falls back to a short date past a week and is safe on bad input", () => {
    expect(timeAgo(new Date(NOW - 30 * 86_400_000).toISOString(), NOW)).toMatch(/\w/);
    expect(timeAgo(null, NOW)).toBe("");
    expect(timeAgo("not-a-date", NOW)).toBe("");
  });
});

describe("formatTime", () => {
  it("returns a clock label and tolerates garbage", () => {
    expect(formatTime("2026-06-04T09:05:00.000Z")).toMatch(/\d{2}:\d{2}/);
    expect(formatTime("nope")).toBe("");
  });
});

describe("sortMessagesAsc", () => {
  it("orders oldest → newest without mutating the input", () => {
    const input = [
      msg({ id: "b", senderId: "u1", createdAt: "2026-06-04T11:00:00.000Z" }),
      msg({ id: "a", senderId: "u1", createdAt: "2026-06-04T10:00:00.000Z" }),
    ];
    const out = sortMessagesAsc(input);
    expect(out.map((m) => m.id)).toEqual(["a", "b"]);
    expect(input.map((m) => m.id)).toEqual(["b", "a"]);
  });
});

describe("buildRenderList", () => {
  const me = "me";
  const list = buildRenderList(
    [
      msg({ id: "1", senderId: "them", createdAt: "2026-06-04T10:00:00.000Z" }),
      msg({ id: "2", senderId: "them", createdAt: "2026-06-04T10:01:00.000Z" }),
      msg({ id: "3", senderId: me, createdAt: "2026-06-04T10:02:00.000Z" }),
    ],
    me,
  );

  it("flags ownership", () => {
    expect(list.map((r) => r.own)).toEqual([false, false, true]);
  });

  it("starts a group only when the sender changes", () => {
    expect(list.map((r) => r.startsGroup)).toEqual([true, false, true]);
  });

  it("shows the avatar on the last incoming bubble of a run only", () => {
    expect(list.map((r) => r.showAvatar)).toEqual([false, true, false]);
  });
});
