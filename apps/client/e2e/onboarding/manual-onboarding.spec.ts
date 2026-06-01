import { expect, test } from "@playwright/test";

type Step = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  component: string;
  fields?: Array<{
    key: string;
    type: string;
    label: string;
    required: boolean;
  }>;
  multipleItems?: boolean;
  sectionTypeKey?: string;
  addLabel?: string;
  placeholder?: string;
  data?: Array<Record<string, unknown>>;
};

const steps: Step[] = [
  {
    id: "personal-info",
    label: "Dados pessoais",
    description: "Quem é você?",
    required: true,
    component: "personal-info",
    fields: [{ key: "fullName", type: "text", label: "Nome completo", required: true }],
  },
  {
    id: "username",
    label: "Username",
    description: "Seu perfil público",
    required: true,
    component: "username",
    fields: [{ key: "username", type: "text", label: "Username", required: true }],
  },
  {
    id: "professional-profile",
    label: "Perfil",
    description: "Seu momento profissional",
    required: true,
    component: "professional-profile",
    fields: [{ key: "jobTitle", type: "text", label: "Cargo", required: true }],
  },
  {
    id: "section:project_v1",
    label: "Projetos",
    description: "Mostre um projeto",
    required: false,
    component: "generic-section",
    multipleItems: true,
    sectionTypeKey: "project_v1",
    addLabel: "Adicionar projeto",
    placeholder: "Nada adicionado ainda",
    fields: [{ key: "name", type: "text", label: "Nome do projeto", required: true }],
  },
  {
    id: "resume-style",
    label: "Estilo",
    description: "Escolha seu modelo",
    required: true,
    component: "resume-style",
    fields: [{ key: "resumeStyleId", type: "text", label: "Estilo", required: true }],
    data: [{ id: "style-1", name: "Clean", description: "Minimal", atsScore: 96 }],
  },
  {
    id: "review",
    label: "Revisão",
    description: "Confira tudo",
    required: true,
    component: "review",
  },
];

function sessionFor(currentStep: string) {
  const index = steps.findIndex((step) => step.id === currentStep);
  return {
    currentStep,
    completedSteps: steps.slice(0, Math.max(0, index)).map((step) => step.id),
    progress: Math.round((index / (steps.length - 1)) * 100),
    strength: { score: 80, message: "Perfil forte", level: "strong" },
    canProceed: true,
    missingRequired:
      currentStep === "review" ? [] : ["personal-info", "username", "professional-profile"],
    nextStep: steps[index + 1]?.id ?? null,
    previousStep: steps[index - 1]?.id ?? null,
    steps,
    availableExtras: [],
    activatedExtras: ["section:project_v1"],
    username: currentStep === "username" ? "" : "maria",
    personalInfo: currentStep === "personal-info" ? {} : { fullName: "Maria Silva" },
    professionalProfile:
      currentStep === "professional-profile" ? {} : { jobTitle: "Software Engineer" },
    sections: [
      {
        sectionTypeKey: "project_v1",
        items: [{ content: { name: "Patch Careers Mobile" } }],
      },
    ],
    resumeStyleId: currentStep === "resume-style" ? null : "style-1",
  };
}

test("manual onboarding flow works on Expo Web", async ({ page }) => {
  let currentStep = "personal-info";
  const browserErrors: string[] = [];
  const networkEvents: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/")) {
      networkEvents.push(`request: ${request.method()} ${request.url()}`);
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/v1/")) {
      networkEvents.push(`response: ${response.status()} ${response.url()}`);
    }
  });

  await page.addInitScript(() => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.setItem("patch-careers:auth:accessToken", "access-token");
      storage.setItem("patch-careers:auth:refreshToken", "refresh-token");
      storage.setItem("patch-careers:auth:tokenExpiresAt", String(Date.now() + 3_600_000));
    }
  });

  await page.route("**/api/v1/auth/session", async (route) => {
    await route.fulfill({
      json: {
        authenticated: true,
        user: {
          id: "u-1",
          email: "maria@example.com",
          name: "Maria Silva",
          username: "maria",
          emailVerified: true,
          isAdmin: false,
          hasCompletedOnboarding: false,
          needsEmailVerification: false,
        },
      },
    });
  });

  await page.route("**/api/v1/users/username/check?**", async (route) => {
    await route.fulfill({ json: { username: "maria", available: true } });
  });

  await page.route(/\/api\/v1\/onboarding\/session(?:\?.*)?$/, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: sessionFor(currentStep) });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/onboarding/session/next**", async (route) => {
    const index = steps.findIndex((step) => step.id === currentStep);
    currentStep = steps[Math.min(index + 1, steps.length - 1)].id;
    await route.fulfill({ status: 201, json: sessionFor(currentStep) });
  });

  await page.route("**/api/v1/onboarding/session/complete**", async (route) => {
    await route.fulfill({ status: 201, json: { ok: true } });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  if (
    !(await page
      .getByText("Dados pessoais")
      .waitFor({ state: "visible", timeout: 45_000 })
      .then(() => true)
      .catch(() => false))
  ) {
    throw new Error(
      `Onboarding did not render. URL: ${page.url()}\n${browserErrors.join("\n")}\n${networkEvents.join("\n")}\n${await page.locator("body").innerText()}`,
    );
  }

  await expect(page.getByText("Dados pessoais")).toBeVisible();
  await expect(page.getByTestId("onboarding.next")).toBeDisabled();
  await page.getByPlaceholder("Nome completo").fill("Maria Silva");
  await expect(page.getByTestId("onboarding.next")).toBeEnabled();
  await page.getByTestId("onboarding.next").click();

  await expect(page.getByText("Username").first()).toBeVisible();
  await expect(page.getByTestId("onboarding.next")).toBeDisabled();
  await page.getByPlaceholder("Username").fill("maria");
  await expect(page.getByTestId("onboarding.next")).toBeEnabled();
  await page.getByTestId("onboarding.next").click();

  await expect(page.getByText("Perfil", { exact: true })).toBeVisible();
  await expect(page.getByTestId("onboarding.next")).toBeDisabled();
  await page.getByPlaceholder("Cargo").fill("Software Engineer");
  await expect(page.getByTestId("onboarding.next")).toBeEnabled();
  await page.getByTestId("onboarding.next").click();

  await expect(page.getByText("Projetos")).toBeVisible();
  await page.getByText("Adicionar projeto").click();
  await page.getByRole("dialog").getByRole("textbox").fill("Patch Careers Mobile");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /salvar|save/i })
    .click();
  await page.getByTestId("onboarding.next").click();

  await expect(page.getByText("Estilo")).toBeVisible();
  await page.getByText("Clean").click();
  await page.getByTestId("onboarding.next").click();

  await expect(page.getByText("Revisão")).toBeVisible();
  await expect(page.getByText("Patch Careers Mobile")).toBeVisible();
  await page.getByTestId("onboarding.complete").click();
});
