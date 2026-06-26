import { describe, expect, it } from "vitest";
import { routeForNotification } from "./notification-routing";

describe("routeForNotification", () => {
  it("routes a message to its conversation thread", () => {
    expect(routeForNotification({ type: "MESSAGE_RECEIVED", entityId: "c1" })).toEqual({
      pathname: "/conversation/[id]",
      params: { id: "c1" },
    });
  });

  it("falls back to the Messages tab when a message has no entity id", () => {
    expect(routeForNotification({ type: "MESSAGE_RECEIVED", entityId: null })).toBe(
      "/(tabs)/messages",
    );
  });

  it("routes a job match to the Jobs tab", () => {
    expect(routeForNotification({ type: "MATCH_RECOMMENDATIONS_READY", entityId: null })).toBe(
      "/(tabs)/jobs",
    );
  });

  it("routes resume quality changes to the Profile tab", () => {
    expect(routeForNotification({ type: "RESUME_QUALITY_IMPROVED", entityId: null })).toBe(
      "/(tabs)/profile",
    );
    expect(routeForNotification({ type: "RESUME_QUALITY_REGRESSED", entityId: null })).toBe(
      "/(tabs)/profile",
    );
  });

  it("routes unknown types to the Notifications tab", () => {
    expect(routeForNotification({ type: "POST_LIKED", entityId: "p1" })).toBe(
      "/(tabs)/notifications",
    );
  });
});
