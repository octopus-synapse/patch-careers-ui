import { describe, expect, it, vi } from "vitest";
import { singleFlight } from "./single-flight";

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("singleFlight", () => {
  it("runs the underlying op once for concurrent callers", async () => {
    const flight = singleFlight<number>();
    const op = vi.fn(async () => 42);

    const [a, b, c] = await Promise.all([flight.run(op), flight.run(op), flight.run(op)]);

    expect(op).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual([42, 42, 42]);
  });

  it("forwards the rejection to every awaiter", async () => {
    const flight = singleFlight<number>();
    const err = new Error("boom");
    const op = vi.fn(async (): Promise<number> => {
      throw err;
    });

    const results = await Promise.allSettled([flight.run(op), flight.run(op)]);

    expect(op).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { status: "rejected", reason: err },
      { status: "rejected", reason: err },
    ]);
  });

  it("clears the slot after settle so the next caller starts a fresh run", async () => {
    const flight = singleFlight<number>();
    let calls = 0;
    const op = async () => ++calls;

    expect(await flight.run(op)).toBe(1);
    await flushMicrotasks();
    expect(flight.isInFlight()).toBe(false);
    expect(await flight.run(op)).toBe(2);
  });

  it("reports in-flight while the op is pending and reset() wipes it", () => {
    const flight = singleFlight<number>();
    void flight.run(() => new Promise<number>(() => {}));
    expect(flight.isInFlight()).toBe(true);
    flight.reset();
    expect(flight.isInFlight()).toBe(false);
  });
});
