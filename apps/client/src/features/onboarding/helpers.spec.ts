import { describe, expect, it } from "vitest";
import {
  buildNextPayload,
  buildReviewSections,
  buildSkipPayload,
  canContinueStep,
  extrasToActivate,
  getSavedDataForStep,
  getSavedItemsForStep,
  isOptionalStep,
  parseResumeStyles,
  validateStepFields,
} from "./helpers";
import type { OnboardingSession, OnboardingStep, SectionItem } from "./types";

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
      fields: [{ key: "jobTitle", type: "text", label: "Cargo", required: true }],
    },
    sectionStep,
    styleStep,
    { id: "review", label: "Revisao", description: "", required: true, component: "review" },
  ],
  availableExtras: [sectionStep],
  activatedExtras: [],
  username: "maria",
  personalInfo: { fullName: "Maria Silva", phone: "+55 11 90000-0000" },
  professionalProfile: { jobTitle: "Software Engineer" },
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
});
