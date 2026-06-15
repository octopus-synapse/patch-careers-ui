import { describe, expect, it } from "vitest";
import {
  countedFlowSteps,
  countedIndexOf,
  countedTotal,
  estimatedRemainingMinutes,
  FLOW_PHASES,
  FLOW_PLAN,
  flowIndexOf,
  flowStepsForServerStep,
  nextFlowStep,
  phaseForFlowStep,
  prevFlowStep,
} from "./flow-plan";

describe("flowPlan", () => {
  it("opens with the language pick, the theme pick, then the welcome intro, and ends at review", () => {
    expect(FLOW_PLAN[0]?.id).toBe("language");
    expect(FLOW_PLAN[1]?.id).toBe("theme");
    expect(FLOW_PLAN[2]?.id).toBe("welcome");
    expect(FLOW_PLAN[FLOW_PLAN.length - 1]?.id).toBe("review");
  });

  it("counts steps excluding the intro", () => {
    expect(FLOW_PLAN[2]?.intro).toBe(true);
    expect(countedFlowSteps().some((step) => step.intro)).toBe(false);
    expect(countedTotal()).toBe(FLOW_PLAN.length - 1);
    expect(countedFlowSteps()[0]?.id).toBe("language");
    expect(countedIndexOf("welcome")).toBe(-1);
    expect(countedIndexOf("language")).toBe(0);
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
    expect(nextFlowStep("language")?.id).toBe("theme");
    expect(nextFlowStep("theme")?.id).toBe("welcome");
    expect(nextFlowStep("welcome")?.id).toBe("location");
    expect(prevFlowStep("welcome")?.id).toBe("theme");
    expect(prevFlowStep("theme")?.id).toBe("language");
    expect(prevFlowStep("location")?.id).toBe("welcome");
    expect(prevFlowStep("language")).toBeUndefined();
    expect(nextFlowStep("review")).toBeUndefined();
  });

  it("every step has a unique id", () => {
    const ids = FLOW_PLAN.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("phases cover every counted step exactly once, in order", () => {
    const phaseIds = FLOW_PHASES.flatMap((phase) => phase.stepIds);
    expect(phaseIds).toEqual(countedFlowSteps().map((step) => step.id));
    expect(new Set(phaseIds).size).toBe(phaseIds.length);
  });

  it("maps a step to its phase (and intro to none)", () => {
    expect(phaseForFlowStep("username")?.key).toBe("identity");
    expect(phaseForFlowStep("education")?.key).toBe("history");
    expect(phaseForFlowStep("review")?.key).toBe("resume");
    expect(phaseForFlowStep("welcome")).toBeUndefined();
  });

  it("estimates non-increasing time as the flow advances, floored at 1", () => {
    const atLanguage = estimatedRemainingMinutes("language");
    const atResume = estimatedRemainingMinutes("resume-style");
    expect(atLanguage).toBeGreaterThanOrEqual(atResume);
    expect(estimatedRemainingMinutes("review")).toBeGreaterThanOrEqual(1);
  });
});
