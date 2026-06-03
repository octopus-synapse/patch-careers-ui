import { describe, expect, it } from "vitest";
import { FLOW_PLAN } from "./flow/flowPlan";
import {
  atsBand,
  backendStepForFlow,
  buildNextPayload,
  buildReviewSections,
  buildSkipPayload,
  canContinueStep,
  defaultCountryFromLocale,
  extrasToActivate,
  fieldsForFlowStep,
  flowStepForBackendStep,
  getSavedDataForStep,
  getSavedItemsForStep,
  isLastFlowStepForBackend,
  isOptionalStep,
  missingRequiredTargets,
  parseResumeStyles,
  validateStepFields,
} from "./helpers";
import type { OnboardingSession, OnboardingStep, SectionItem } from "./types";

const flow = (id: string) => {
  const step = FLOW_PLAN.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`unknown flow step ${id}`);
  return step;
};

const personalStep: OnboardingStep = {
  id: "personal-info",
  label: "Dados pessoais",
  description: "",
  required: true,
  component: "personal-info",
  fields: [
    { key: "fullName", type: "text", label: "Nome", required: true, minLength: 2 },
    { key: "phone", type: "text", label: "Telefone", required: false },
  ],
};

const sectionStep: OnboardingStep = {
  id: "section:project_v1",
  label: "Projetos",
  description: "",
  required: false,
  component: "generic-section",
  multipleItems: true,
  sectionTypeKey: "project_v1",
  fields: [{ key: "name", type: "text", label: "Nome", required: true }],
};

const styleStep: OnboardingStep = {
  id: "resume-style",
  label: "Estilo",
  description: "",
  required: true,
  component: "resume-style",
  fields: [{ key: "resumeStyleId", type: "text", label: "Estilo", required: true }],
  data: [
    {
      id: "style-1",
      name: "Clean",
      description: "Minimal",
      category: "system",
      tags: ["ATS"],
      thumbnailUrl: "https://example.com/style.png",
      atsScore: 96,
    },
  ],
};

const session: OnboardingSession = {
  currentStep: "personal-info",
  completedSteps: [],
  progress: 20,
  canProceed: false,
  missingRequired: ["personal-info"],
  nextStep: "username",
  previousStep: null,
  steps: [
    personalStep,
    {
      id: "username",
      label: "Username",
      description: "",
      required: true,
      component: "username",
      fields: [{ key: "username", type: "text", label: "Username", required: true }],
    },
    {
      id: "professional-profile",
      label: "Perfil",
      description: "",
      required: true,
      component: "professional-profile",
      fields: [
        { key: "headline", type: "text", label: "Headline", required: false },
        { key: "summary", type: "textarea", label: "Resumo", required: false },
        { key: "linkedin", type: "url", label: "LinkedIn", required: false },
      ],
    },
    {
      id: "section:work_experience_v1",
      label: "Experiência",
      description: "",
      required: false,
      component: "generic-section",
      multipleItems: true,
      sectionTypeKey: "work_experience_v1",
      fields: [{ key: "role", type: "text", label: "Cargo", required: true }],
    },
    sectionStep,
    styleStep,
    { id: "review", label: "Revisao", description: "", required: true, component: "review" },
  ],
  availableExtras: [sectionStep],
  activatedExtras: [],
  username: "maria",
  personalInfo: { fullName: "Maria Silva", phone: "+55 11 90000-0000" },
  professionalProfile: { headline: "Software Engineer", summary: "Builds things." },
  sections: [
    {
      sectionTypeKey: "project_v1",
      items: [{ id: "project-1", content: { name: "Patch Careers", role: "Mobile" } }],
    },
  ],
  resumeStyleId: "style-1",
};

describe("onboarding helpers", () => {
  it("hydrates saved field data from the session", () => {
    expect(getSavedDataForStep(session, personalStep)).toEqual({
      fullName: "Maria Silva",
      phone: "+55 11 90000-0000",
    });
    expect(getSavedDataForStep(session, styleStep)).toEqual({ resumeStyleId: "style-1" });
  });

  it("hydrates section items from the matching section", () => {
    expect(getSavedItemsForStep(session, sectionStep)).toEqual([
      { id: "project-1", content: { name: "Patch Careers", role: "Mobile" } },
    ]);
  });

  it("blocks required fields before continuing", () => {
    expect(validateStepFields(personalStep, { fullName: "" })).toEqual({
      fullName: "Campo obrigatório",
    });
    expect(canContinueStep(personalStep, { fullName: "" }, [])).toBe(false);
    expect(canContinueStep(personalStep, { fullName: "Ma" }, [])).toBe(true);
  });

  it("treats section steps as skippable and builds API payloads", () => {
    const items: SectionItem[] = [{ content: { name: "Patch Careers" } }];
    expect(isOptionalStep(sectionStep)).toBe(true);
    expect(buildNextPayload(sectionStep, {}, items)).toEqual({ items });
    expect(buildSkipPayload()).toEqual({ noData: true });
  });

  it("parses resume style options and builds review sections", () => {
    expect(parseResumeStyles(styleStep)).toEqual([
      {
        id: "style-1",
        name: "Clean",
        description: "Minimal",
        category: "system",
        tags: ["ATS"],
        thumbnailUrl: "https://example.com/style.png",
        atsScore: 96,
      },
    ]);

    const review = buildReviewSections(session, session.steps);
    expect(review.map((section) => section.stepId)).toContain("personal-info");
    expect(review.map((section) => section.stepId)).toContain("section:project_v1");
    expect(review.map((section) => section.stepId)).toContain("resume-style");
  });

  it("validates only the requested field slice", () => {
    const profileStep = session.steps.find((step) => step.id === "professional-profile");
    if (!profileStep) throw new Error("missing professional-profile step");
    // linkedin is not a valid URL, but the headline slice ignores it.
    const data = { linkedin: "not-a-url" };
    expect(validateStepFields(profileStep, data, ["headline"])).toEqual({});
    expect(validateStepFields(profileStep, data, ["linkedin"]).linkedin).toBeDefined();
  });

  it("resolves the backend step for a flow step", () => {
    expect(backendStepForFlow(session, flow("location"))?.id).toBe("personal-info");
    expect(backendStepForFlow(session, flow("headline"))?.id).toBe("professional-profile");
    expect(backendStepForFlow(session, flow("experience"))?.id).toBe("section:work_experience_v1");
    expect(backendStepForFlow(session, flow("language"))).toBeUndefined();
  });

  it("slices a backend step's fields to the flow step's fieldKeys", () => {
    const profileStep = backendStepForFlow(session, flow("headline"));
    expect(fieldsForFlowStep(profileStep, flow("headline")).map((field) => field.key)).toEqual([
      "headline",
      "summary",
    ]);
    expect(fieldsForFlowStep(profileStep, flow("links")).map((field) => field.key)).toEqual([
      "linkedin",
    ]);
  });

  it("marks only the last sibling flow step as persisting", () => {
    expect(isLastFlowStepForBackend(flow("location"))).toBe(false);
    expect(isLastFlowStepForBackend(flow("personal"))).toBe(true);
    expect(isLastFlowStepForBackend(flow("headline"))).toBe(false);
    expect(isLastFlowStepForBackend(flow("links"))).toBe(true);
    expect(isLastFlowStepForBackend(flow("experience"))).toBe(true);
  });

  it("maps a backend step back to its first flow step (resume cursor)", () => {
    expect(flowStepForBackendStep(session, "personal-info")?.id).toBe("location");
    expect(flowStepForBackendStep(session, "professional-profile")?.id).toBe("headline");
    expect(flowStepForBackendStep(session, "welcome")).toBeUndefined();
  });

  it("activates project and certification extras only", () => {
    expect(
      extrasToActivate({
        ...session,
        availableExtras: [
          sectionStep,
          { ...sectionStep, id: "section:certification_v1", sectionTypeKey: "certification_v1" },
          { ...sectionStep, id: "section:award_v1", sectionTypeKey: "award_v1" },
        ],
      }),
    ).toEqual(["section:project_v1", "section:certification_v1"]);
  });

  it("maps missingRequired step ids to actionable targets", () => {
    const targets = missingRequiredTargets(session);
    expect(targets).toEqual([
      { stepId: "personal-info", flowStepId: "location", label: "Dados pessoais" },
    ]);
    expect(missingRequiredTargets({ ...session, missingRequired: [] })).toEqual([]);
    expect(missingRequiredTargets(undefined)).toEqual([]);
  });

  it("derives a default country from the locale (hint only)", () => {
    expect(defaultCountryFromLocale("pt-BR")).toBe("BR");
    expect(defaultCountryFromLocale("en")).toBe("US");
    expect(defaultCountryFromLocale("es-MX")).toBe("MX");
    expect(defaultCountryFromLocale(undefined)).toBeUndefined();
  });

  it("buckets ATS scores into bands", () => {
    expect(atsBand(96)).toBe("high");
    expect(atsBand(80)).toBe("good");
    expect(atsBand(60)).toBe("fair");
    expect(atsBand(null)).toBeNull();
    expect(atsBand(undefined)).toBeNull();
  });
});
