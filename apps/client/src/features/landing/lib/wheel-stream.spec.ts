import { describe, expect, it } from "vitest";
import { IDLE_WHEEL_STREAM, reduceWheel, type WheelStream } from "./wheel-stream";

/** Feed a series of [delta, timestamp] events and collect the steps produced. */
function play(events: readonly (readonly [number, number])[]): (1 | -1 | 0)[] {
  let state: WheelStream = IDLE_WHEEL_STREAM;
  const steps: (1 | -1 | 0)[] = [];
  for (const [delta, at] of events) {
    const result = reduceWheel(state, delta, at);
    state = result.state;
    steps.push(result.step);
  }
  return steps;
}

describe("reduceWheel", () => {
  it.each([1, 3, 16, 120, 800, 12000])("moves exactly once for a delta of %s", (delta) => {
    expect(
      play([
        [delta, 0],
        [delta, 16],
        [delta, 32],
      ]),
    ).toEqual([1, 0, 0]);
  });
  it("fires once for a single decisive mouse notch", () => {
    expect(play([[120, 0]])).toEqual([1]);
  });

  it("goes back when the delta is negative", () => {
    expect(play([[-120, 0]])).toEqual([-1]);
  });

  it("ignores a nudge below the threshold", () => {
    expect(play([[0.1, 0]])).toEqual([0]);
  });

  it("accumulates small trackpad deltas until they add up to a step", () => {
    expect(
      play([
        [0.3, 0],
        [0.3, 20],
        [0.3, 40],
        [0.3, 60],
      ]),
    ).toEqual([0, 0, 0, 1]);
  });

  it("fires only ONCE for a long trackpad flick — the inertia tail is swallowed", () => {
    const flick = Array.from({ length: 20 }, (_, i) => [15, i * 16] as const);
    expect(play(flick).filter((step) => step !== 0)).toEqual([1]);
  });

  it("arms again after the user pauses between gestures", () => {
    const steps = play([
      [50, 0], // fires
      [50, 20], // same stream, swallowed
      [50, 500], // new stream after the gap — fires again
    ]);
    expect(steps).toEqual([1, 0, 1]);
  });

  it("lets a reversed gesture fire in the other direction after a pause", () => {
    expect(
      play([
        [60, 0],
        [-60, 400],
      ]),
    ).toEqual([1, -1]);
  });

  it("does not carry accumulation across a pause", () => {
    // Two subpixel events would clear the threshold together; a pause resets it.
    expect(
      play([
        [0.6, 0],
        [0.6, 400],
      ]),
    ).toEqual([0, 0]);
  });
});
