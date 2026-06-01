import { describe, expect, it } from "vitest";
import {
  FLOW_PLAN,
  flowIndexOf,
  flowStepsForServerStep,
  nextFlowStep,
  prevFlowStep,
} from "./flowPlan";

describe("flowPlan", () => {
  it("starts at language and ends at review", () => {
    expect(FLOW_PLAN[0]?.id).toBe("language");
    expect(FLOW_PLAN[FLOW_PLAN.length - 1]?.id).toBe("review");
  });

  it("orders experience before headline (headline suggested from the job)", () => {
    expect(flowIndexOf("experience")).toBeLessThan(flowIndexOf("headline"));
  });

  it("orders headline before links", () => {
    expect(flowIndexOf("headline")).toBeLessThan(flowIndexOf("links"));
  });

  it("location and personal both persist to personal-info", () => {
    const ids = flowStepsForServerStep("personal-info").map((s) => s.id);
    expect(ids).toEqual(["location", "personal"]);
  });

  it("headline and links both persist to professional-profile", () => {
    const ids = flowStepsForServerStep("professional-profile").map((s) => s.id);
    expect(ids).toEqual(["headline", "links"]);
  });

  it("links step owns the portfolio field", () => {
    const links = FLOW_PLAN.find((s) => s.id === "links");
    expect(links?.fieldKeys).toContain("portfolio");
  });

  it("navigates next/prev correctly", () => {
    expect(nextFlowStep("language")?.id).toBe("location");
    expect(prevFlowStep("location")?.id).toBe("language");
    expect(prevFlowStep("language")).toBeUndefined();
    expect(nextFlowStep("review")).toBeUndefined();
  });

  it("every step has a unique id", () => {
    const ids = FLOW_PLAN.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
