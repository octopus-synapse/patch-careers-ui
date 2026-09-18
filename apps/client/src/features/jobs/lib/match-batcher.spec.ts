import { describe, expect, it, vi } from "vitest";
import { createMatchBatcher } from "./match-batcher";

describe("master match request batching", () => {
  it("shares duplicate pairs, isolates resumes and respects the twenty-job limit", async () => {
    const fetch = vi.fn(async (_resume: string, ids: string[]) => ({
      scores: ids.map((jobId) => ({ jobId, overallScore: 84.9 })),
    }));
    const request = createMatchBatcher(fetch);
    const scores = await Promise.all([
      ...Array.from({ length: 41 }, (_, index) => request("master", String(index))),
      request("master", "0"),
      request("other-master", "0"),
    ]);
    expect(scores).toHaveLength(43);
    expect(scores.every((score) => score === 84.9)).toBe(true);
    expect(
      fetch.mock.calls.filter(([resume]) => resume === "master").map(([, ids]) => ids.length),
    ).toEqual([20, 20, 1]);
    expect(fetch.mock.calls.filter(([resume]) => resume === "other-master")).toHaveLength(1);
  });
  it("represents missing scores as unavailable and propagates request failures", async () => {
    const request = createMatchBatcher(async () => ({ scores: [] }));
    expect(await request("master", "missing")).toBeNull();
    const failing = createMatchBatcher(async () => {
      throw new Error("unavailable");
    });
    await expect(failing("master", "job")).rejects.toThrow("unavailable");
  });
});
