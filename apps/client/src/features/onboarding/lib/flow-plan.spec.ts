import { describe, expect, it } from "vitest";
import {
  countedFlowSteps,
  countedIndexOf,
  countedTotal,
  FLOW_PLAN,
  flowIndexOf,
  flowStepsForServerStep,
  nextFlowStep,
  prevFlowStep,
} from "./flow-plan";

describe("flowPlan", () => {
  it("opens with language, then plan and payment, and ends at review", () => {
    expect(FLOW_PLAN[0]?.id).toBe("language");
    expect(FLOW_PLAN[1]?.id).toBe("plan");
    expect(FLOW_PLAN[2]?.id).toBe("payment");
    expect(FLOW_PLAN[3]?.id).toBe("location");
    expect(FLOW_PLAN[FLOW_PLAN.length - 1]?.id).toBe("review");
  });

  it("counts every step", () => {
    expect(countedTotal()).toBe(FLOW_PLAN.length);
    expect(countedFlowSteps()[0]?.id).toBe("language");
    expect(countedIndexOf("language")).toBe(0);
    expect(countedTotal("free")).toBe(FLOW_PLAN.length - 1);
    expect(countedIndexOf("location", "free")).toBe(2);
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
    expect(nextFlowStep("language")?.id).toBe("plan");
    expect(prevFlowStep("location")?.id).toBe("payment");
    expect(prevFlowStep("language")).toBeUndefined();
    expect(nextFlowStep("review")).toBeUndefined();
  });

  it("every step has a unique id", () => {
    const ids = FLOW_PLAN.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
