import { describe, expect, it } from "vitest";
import { jobsViewport } from "./responsive-layout";

describe("jobsViewport", () => {
  it.each([
    [767, "compact", false, 1],
    [768, "compact", true, 2],
    [1023, "compact", true, 2],
    [1024, "desktop", true, 4],
  ] as const)("maps %ipx to the expected capabilities", (width, presentation, canChoose, columns) => {
    expect(jobsViewport(width)).toEqual({
      presentation,
      canChooseLayout: canChoose,
      gridColumns: columns,
    });
  });
});
