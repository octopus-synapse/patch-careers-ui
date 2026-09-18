import { describe, expect, it } from "vitest";
import { connectionBeats, manifestoBeats } from "./cinema-math";

describe("the connection reveal", () => {
  it("does not announce the connection while the shapes are approaching", () => {
    for (const progress of [0, 0.2, 0.5, 0.75]) {
      const beat = connectionBeats(progress);
      expect(beat.lead).toBe(0);
      expect(beat.emphasis).toBe(0);
      expect(beat.caption).toBe(0);
    }
  });

  it("assembles the pieces before the payoff is revealed", () => {
    expect(connectionBeats(0.8).approach).toBe(1);
    expect(connectionBeats(0.8).emphasis).toBe(0);
    expect(connectionBeats(0.9).lead).toBe(1);
    expect(connectionBeats(0.9).emphasis).toBeGreaterThan(0);
    expect(connectionBeats(1)).toEqual({
      approach: 1,
      lead: 1,
      emphasis: 1,
      caption: 1,
      ripple: 1,
    });
  });

  it("hides the reveal again when the user scrolls backwards", () => {
    connectionBeats(1);
    expect(connectionBeats(0.2).emphasis).toBe(0);
    expect(connectionBeats(-1).approach).toBe(0);
    expect(connectionBeats(2).caption).toBe(1);
  });
});

describe("the manifesto supporting details", () => {
  it("waits for the character reveal to finish", () => {
    for (const progress of [0, 0.4, 0.86, 0.88]) {
      expect(manifestoBeats(progress).rule).toBe(0);
      expect(manifestoBeats(progress).caption).toBe(0);
    }
    expect(manifestoBeats(1)).toEqual({ rule: 1, caption: 1 });
  });
});
