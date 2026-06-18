/**
 * DEV-only "test fill" engine for the onboarding wizard.
 *
 * `fillStep` pre-fills the CURRENT step's data into the wizard store and stays
 * put (the user reviews and taps Continue). `fillAll` drives the whole flow
 * end-to-end by PERSISTING each backend step (reusing the wizard's `commitSave`
 * = goto+next), then lands the cursor on the review step — so the review
 * reflects the server and "Complete" works.
 *
 * `fillAll` bypasses the reactive store and posts backend payloads directly,
 * which avoids racing the wizard's "reset draft on step change" effect.
 *
 * Gated by `isDevTestFillEnabled()` at the call site (the wizard) — this hook is
 * side-effect-free on mount, so an unused instance costs nothing in production.
 */

import { getV1GeoLocations } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { useState } from "react";
import type { ColorScheme } from "@/providers/color-scheme";
import { FLOW_PLAN, type FlowStep, type FlowStepId } from "../lib/flow-plan";
import { backendStepForFlow, parseResumeStyles } from "../lib/helpers";
import {
  EDUCATION_ITEMS,
  EXPERIENCE_ITEMS,
  FORM_FIXTURES,
  fixtureFormFor,
  fixtureItemsFor,
  makeTestUsername,
  TEST_LOCATION_FALLBACK_LABEL,
  TEST_LOCATION_QUERY,
} from "../lib/test-fixtures";
import type { FormData, OnboardingSession, OnboardingStep, SectionItem } from "../types";

const DEFAULT_THEME: ColorScheme = "dark";

type TestFillDeps = {
  session: OnboardingSession | undefined;
  saveStep: (stepId: string, payload: Record<string, unknown>) => Promise<boolean>;
  setFlowStepId: (id: FlowStepId) => void;
  setFormData: (value: FormData | ((prev: FormData) => FormData)) => void;
  setItems: (items: SectionItem[]) => void;
  setLocale: (locale: Locale) => void;
  setScheme: (scheme: ColorScheme) => void;
};

function flowById(id: FlowStepId): FlowStep | undefined {
  return FLOW_PLAN.find((step) => step.id === id);
}

/** Resolve a canonical, server-valid location label (GeoNames). Falls back to a
 * literal if the lookup is empty/unavailable. */
async function resolveLocationLabel(): Promise<string> {
  try {
    const res = await getV1GeoLocations({ q: TEST_LOCATION_QUERY, country: "BR", limit: 1 });
    return res.items[0]?.label ?? TEST_LOCATION_FALLBACK_LABEL;
  } catch {
    return TEST_LOCATION_FALLBACK_LABEL;
  }
}

export function useTestFill(deps: TestFillDeps) {
  const { session, saveStep, setFlowStepId, setFormData, setItems, setLocale, setScheme } = deps;
  const [isRunning, setIsRunning] = useState(false);

  /** Per-step: fill the current step's data and stay on it. */
  function fillStep(flowStepId: FlowStepId, currentStep: OnboardingStep | undefined): void {
    const items = fixtureItemsFor(flowStepId);
    if (items) {
      setItems(items);
      return;
    }
    if (flowStepId === "language") {
      setLocale("pt-BR");
      return;
    }
    if (flowStepId === "theme") {
      setScheme(DEFAULT_THEME);
      return;
    }
    if (flowStepId === "resume-style") {
      const first = parseResumeStyles(currentStep)[0]?.id;
      if (first) setFormData((prev) => ({ ...prev, resumeStyleId: first }));
      return;
    }
    const form = fixtureFormFor(flowStepId);
    if (form) setFormData((prev) => ({ ...prev, ...form }));
  }

  /** Resolve the backend step id for a flow step from the current session. */
  function backendStepIdFor(flowStepId: FlowStepId): string | undefined {
    return backendStepForFlow(session, flowById(flowStepId))?.id;
  }

  /** Fill everything, persisting each backend step, then go to review. Stops on
   * the first failed save. */
  async function fillAll(): Promise<void> {
    if (isRunning) return;
    setIsRunning(true);
    try {
      // Local preference steps (no backend).
      setLocale("pt-BR");
      setScheme(DEFAULT_THEME);

      // personal-info = location (server-validated) + name/phone, one backend step.
      const location = await resolveLocationLabel();
      if (!(await saveStep("personal-info", { location, ...FORM_FIXTURES.personal }))) return;

      // username (unique per run).
      if (!(await saveStep("username", { username: makeTestUsername() }))) return;

      // experience section.
      const expStepId = backendStepIdFor("experience");
      if (expStepId && !(await saveStep(expStepId, { items: EXPERIENCE_ITEMS }))) return;

      // professional-profile = headline + summary + links, one backend step.
      if (
        !(await saveStep("professional-profile", {
          ...FORM_FIXTURES.headline,
          ...FORM_FIXTURES.links,
        }))
      ) {
        return;
      }

      // education section.
      const eduStepId = backendStepIdFor("education");
      if (eduStepId && !(await saveStep(eduStepId, { items: EDUCATION_ITEMS }))) return;

      // resume-style: auto-pick the first available style.
      const styleStep = backendStepForFlow(session, flowById("resume-style"));
      const styleId = parseResumeStyles(styleStep)[0]?.id;
      if (styleId && !(await saveStep("resume-style", { resumeStyleId: styleId }))) return;

      // Land on the review hub.
      setFlowStepId("review");
    } finally {
      setIsRunning(false);
    }
  }

  return { fillStep, fillAll, isRunning };
}
