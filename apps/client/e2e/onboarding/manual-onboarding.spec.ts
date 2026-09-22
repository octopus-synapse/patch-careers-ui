/**
 * Onboarding e2e (Expo Web + mocked backend) — walks the CURRENT flow:
 * idioma (seleção + Continuar) → localização → sobre você
 * (fullName prefilled from the auth user) → username (suggested handle) →
 * experiência ("Pular") → título profissional → links ("Adicionar link"
 * modal) → formação ("Pular") → review (checklist)
 * → concluir → tela de conclusão → app.
 *
 * The backend is fully mocked via `page.route`; a small mutable
 * `serverState` mirrors what the wizard saves so later steps can hydrate.
 */
import { expect, type Page, test } from "@playwright/test";

type StepField = {
  key: string;
  type: string;
  label: string;
  required: boolean;
  examples?: string[];
};

type Step = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  component: string;
  fields?: StepField[];
  multipleItems?: boolean;
  sectionTypeKey?: string;
  addLabel?: string;
  data?: Array<Record<string, unknown>>;
};

const steps: Step[] = [
  {
    id: "personal-info",
    label: "Dados pessoais",
    description: "",
    required: true,
    component: "personal-info",
    fields: [
      { key: "fullName", type: "text", label: "Nome completo", required: true },
      { key: "phone", type: "text", label: "Telefone", required: false },
      { key: "location", type: "text", label: "Localização", required: false },
    ],
  },
  {
    id: "username",
    label: "Usuário",
    description: "",
    required: true,
    component: "username",
    fields: [{ key: "username", type: "text", label: "Nome de usuário", required: true }],
  },
  {
    id: "section:work_experience_v1",
    label: "Experiência",
    description: "",
    required: false,
    component: "generic-section",
    multipleItems: true,
    sectionTypeKey: "work_experience_v1",
    addLabel: "Adicionar experiência",
    fields: [{ key: "role", type: "text", label: "Cargo", required: true }],
  },
  {
    id: "professional-profile",
    label: "Perfil",
    description: "",
    required: true,
    component: "professional-profile",
    fields: [
      {
        key: "headline",
        type: "text",
        label: "Título profissional",
        required: false,
        examples: ["Engenheira de Software"],
      },
      {
        key: "summary",
        type: "textarea",
        label: "Resumo profissional",
        required: false,
        examples: ["Conte sua trajetória"],
      },
      { key: "linkedin", type: "url", label: "LinkedIn", required: false },
      { key: "github", type: "url", label: "GitHub", required: false },
      { key: "website", type: "url", label: "Website", required: false },
      { key: "portfolio", type: "url", label: "Portfólio", required: false },
    ],
  },
  {
    id: "section:education_v1",
    label: "Formação",
    description: "",
    required: false,
    component: "generic-section",
    multipleItems: true,
    sectionTypeKey: "education_v1",
    addLabel: "Adicionar formação",
    fields: [{ key: "institution", type: "text", label: "Instituição", required: true }],
  },
  {
    id: "resume-style",
    label: "Estilo",
    description: "",
    required: true,
    component: "resume-style",
    fields: [{ key: "resumeStyleId", type: "text", label: "Estilo", required: true }],
    data: [
      {
        id: "01900000-0000-7000-8000-000000000001",
        name: "Clássico",
        description: null,
        atsScore: 100,
      },
    ],
  },
  { id: "review", label: "Revisão", description: "", required: true, component: "review" },
];

type ServerState = {
  gotoStep: string | null;
  username: string | null;
  personalInfo: Record<string, unknown>;
  professionalProfile: Record<string, unknown>;
  sections: Array<{ sectionTypeKey: string; noData?: boolean; items: unknown[] }>;
  resumeStyleId: string | null;
  completed: boolean;
};

function sessionFor(state: ServerState) {
  return {
    currentStep: null,
    completedSteps: [],
    progress: 0,
    canProceed: true,
    missingRequired: [],
    nextStep: null,
    previousStep: null,
    steps,
    availableExtras: [],
    activatedExtras: [],
    username: state.username,
    personalInfo: state.personalInfo,
    professionalProfile: state.professionalProfile,
    sections: state.sections,
    resumeStyleId: state.resumeStyleId,
  };
}

async function mockBackend(page: Page, state: ServerState): Promise<void> {
  // Catch-all first (lowest precedence): later registrations win in Playwright.
  await page.route("**/api/v1/**", async (route) => {
    await route.fulfill({ json: {} });
  });

  await page.route("**/api/v1/auth/session", async (route) => {
    await route.fulfill({
      json: {
        authenticated: true,
        user: {
          id: "u-1",
          email: "maria@example.com",
          name: "Maria Silva",
          username: state.username,
          emailVerified: true,
          isAdmin: false,
          hasCompletedOnboarding: state.completed,
          needsEmailVerification: false,
        },
      },
    });
  });

  await page.route("**/api/v1/users/preferences/full", async (route) => {
    await route.fulfill({ json: { preferences: { language: "pt-BR" } } });
  });

  await page.route("**/api/v1/geo/locations**", async (route) => {
    await route.fulfill({
      json: { items: [{ label: "São Paulo, SP, Brasil", countryCode: "BR", stateCode: "SP" }] },
    });
  });

  await page.route("**/api/v1/users/username/check?**", async (route) => {
    await route.fulfill({ json: { username: "maria_silva", available: true } });
  });

  await page.route("**/api/v1/resume-styles", async (route) => {
    await route.fulfill({
      json: { items: [{ id: "01900000-0000-7000-8000-000000000001", styleScore: 100 }] },
    });
  });

  await page.route("**/api/v1/onboarding/session/resume-preview**", async (route) => {
    await route.fulfill({
      json: { html: "<!doctype html><html><body><h1>PREVIEW</h1></body></html>" },
    });
  });

  await page.route(/\/api\/v1\/onboarding\/session(?:\?.*)?$/, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: sessionFor(state) });
      return;
    }
    await route.fulfill({ json: sessionFor(state) });
  });

  await page.route("**/api/v1/onboarding/session/goto**", async (route) => {
    const body = route.request().postDataJSON() as { stepId?: string };
    state.gotoStep = body?.stepId ?? null;
    await route.fulfill({ status: 201, json: sessionFor(state) });
  });

  await page.route("**/api/v1/onboarding/session/next**", async (route) => {
    const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
    const target = state.gotoStep ?? "";
    if (target === "personal-info") {
      state.personalInfo = { ...state.personalInfo, ...body };
    } else if (target === "username" && typeof body.username === "string") {
      state.username = body.username;
    } else if (target === "professional-profile") {
      state.professionalProfile = { ...state.professionalProfile, ...body };
    } else if (target.startsWith("section:")) {
      const sectionTypeKey = target.slice("section:".length);
      state.sections = state.sections.filter((s) => s.sectionTypeKey !== sectionTypeKey);
      state.sections.push({
        sectionTypeKey,
        items: Array.isArray(body.items) ? (body.items as unknown[]) : [],
        ...(body.noData === true ? { noData: true } : {}),
      });
    } else if (target === "resume-style" && typeof body.resumeStyleId === "string") {
      state.resumeStyleId = body.resumeStyleId;
    }
    await route.fulfill({ status: 201, json: sessionFor(state) });
  });

  await page.route("**/api/v1/onboarding/session/complete**", async (route) => {
    state.completed = true;
    await route.fulfill({ status: 201, json: { ok: true } });
  });
}

test("onboarding flow atual funciona no Expo Web", async ({ page }) => {
  const state: ServerState = {
    gotoStep: null,
    username: null,
    personalInfo: {},
    professionalProfile: {},
    sections: [],
    resumeStyleId: null,
    completed: false,
  };

  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));

  await page.addInitScript(() => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.setItem("patch-careers:auth:accessToken", "access-token");
      storage.setItem("patch-careers:auth:refreshToken", "refresh-token");
      storage.setItem("patch-careers:auth:tokenExpiresAt", String(Date.now() + 3_600_000));
    }
  });

  await mockBackend(page, state);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  const next = page.getByTestId("onboarding.next");

  // 1. Idioma — selecionar não avança; o CTA confirma a escolha.
  if (
    !(await page
      .getByText("Português (Brasil)")
      .first()
      .waitFor({ state: "visible", timeout: 45_000 })
      .then(() => true)
      .catch(() => false))
  ) {
    throw new Error(`Onboarding não renderizou. URL: ${page.url()}\n${browserErrors.join("\n")}`);
  }
  await expect(next).toBeVisible();
  await page.getByText("Português (Brasil)").first().click();
  await expect(page.getByText("Português (Brasil)").first()).toBeVisible();
  await next.click();

  // 2. Localização — selecionar uma cidade do catálogo.
  await expect(page.getByText("Onde você", { exact: false })).toBeVisible();
  await expect(page.getByText("2 / 9")).toBeVisible();
  await page.getByText("Selecione a localização").click();
  await page.getByPlaceholder("Comece a digitar…").fill("São Paulo");
  await page.getByRole("button", { name: /São Paulo SP/ }).click();
  await next.click();

  // 5. Sobre você — nome vem pré-preenchido do cadastro.
  await expect(page.getByText("Sobre você")).toBeVisible();
  await expect(page.getByRole("textbox").first()).toHaveValue("Maria Silva");
  await page.getByRole("textbox", { name: "Telefone" }).fill("11978833101");
  await next.click();

  // 6. Username — sugestão derivada do nome + check de disponibilidade.
  await expect(page.getByRole("textbox").first()).toHaveValue("maria_silva");
  await expect(page.getByText("Disponível")).toBeVisible();
  await next.click();

  // 7. Experiência vazia — o CTA vira "Pular" (sem checkbox).
  await expect(page.getByText("Sua experiência", { exact: false })).toBeVisible();
  await expect(next).toContainText(/pular/i);
  await expect(next).toBeEnabled();
  await next.click();

  // 8. Título profissional + resumo.
  await expect(page.getByText("título", { exact: false }).first()).toBeVisible();
  await page.getByRole("textbox").first().fill("Engenheira Frontend");
  await page.getByPlaceholder("Conte sua trajetória").fill("Construo apps móveis há cinco anos.");
  await next.click();

  // 9. Links — "+ Adicionar link" abre o modal plataforma → URL.
  await expect(page.getByText("Seus links")).toBeVisible();
  await expect(next).toContainText(/pular/i);
  await page.getByText("Adicionar link").first().click();
  await page.getByText("LinkedIn", { exact: true }).last().click();
  await page.getByPlaceholder("https://...").fill("https://www.linkedin.com/in/maria-silva");
  await page.getByRole("button", { name: /salvar/i }).click();
  await expect(page.getByText("https://www.linkedin.com/in/maria-silva")).toBeVisible();
  await expect(next).toContainText(/continuar/i);
  await next.click();

  // 10. Formação vazia — Pular.
  await expect(page.getByText("Sua formação")).toBeVisible();
  await expect(next).toContainText(/pular/i);
  await next.click();

  // A revisão vem direto após a formação; Clássico foi salvo automaticamente.
  await expect(page.getByText("Quase lá", { exact: false })).toBeVisible();
  await expect(page.getByText("Escolha um estilo", { exact: false })).toHaveCount(0);
  expect(state.resumeStyleId).toBe("01900000-0000-7000-8000-000000000001");
  await expect(page.getByText("Dados pessoais")).toBeVisible();
  await page.getByTestId("onboarding.complete").click();

  // 13. Ao concluir, entra diretamente no app.
  await page.waitForURL("**/profile", { timeout: 30_000 });
});
