import { expect, type Page, test } from "@playwright/test";

const { mockJobsBackend } = require("./fixtures.cjs");
test.use({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
  screenshot: "only-on-failure",
  trace: "retain-on-failure",
});

async function openJobs(page: Page) {
  await page.goto("/jobs");
  await expect(page.getByTestId("jobs-desktop")).toBeVisible();
  await expect(page.locator("#carousel-recommended")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test("desktop shelves, filters, view-all, saved state and direct detail navigation", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openJobs(page);
  await expect(page.getByRole("link", { name: "Início", exact: true })).toBeVisible();
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1100 });
    const dimensions = await page.locator("#carousel-recommended").evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const cards = [...node.querySelectorAll('[data-testid^="opportunity-"]')].map((card) =>
        card.getBoundingClientRect(),
      );
      return {
        visible: cards.filter((card) => card.left >= rect.left - 1 && card.right <= rect.right + 1)
          .length,
        width: rect.width,
      };
    });
    expect(dimensions.visible).toBe(4);
    expect(dimensions.width).toBeLessThanOrEqual(1204);
  }
  await page.getByRole("button", { name: "Próximas vagas — Recomendadas para você" }).click();
  await expect
    .poll(() => page.locator("#carousel-recommended").evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(100);
  await page.locator("#carousel-recommended").focus();
  await page.keyboard.press("Home");
  await expect
    .poll(() => page.locator("#carousel-recommended").evaluate((node) => node.scrollLeft))
    .toBeLessThanOrEqual(3);

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("textbox", { name: "Localização", exact: true }).fill("São Paulo");
  await page.getByRole("button", { name: "Fechar filtros", exact: true }).last().click();
  await expect(page).not.toHaveURL(/location=/);
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Localização", exact: true })).toHaveValue("");
  await page.getByRole("textbox", { name: "Localização", exact: true }).fill("São Paulo");
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page).toHaveURL(/location=/);
  await expect(page.locator("#carousel-recommended")).not.toContainText("Global");
  await page.getByRole("button", { name: "Ver tudo em Recomendadas para você" }).click();
  await expect(page).toHaveURL(/group=recommended/);
  await expect(page).toHaveURL(/location=/);
  await page.getByRole("button", { name: "Limpar tudo", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("location")).toBe("");
  const card = page.getByTestId(`opportunity-${fixture.id(1)}`);
  await card.getByRole("button", { name: "Salvar vaga", exact: true }).click();
  await expect(card.getByRole("button", { name: "Remover dos salvos" })).toBeVisible();
  await page.getByRole("tab", { name: /Salvas/ }).click();
  await expect(page.getByTestId(`opportunity-${fixture.id(1)}`)).toBeVisible();
  await page
    .getByTestId(`opportunity-${fixture.id(1)}`)
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(new RegExp(`/job/${fixture.id(1)}`));
  await expect(page.getByRole("heading", { name: "Sobre a vaga" })).toBeVisible();
  await expect(
    page
      .getByTestId("job-desktop-detail")
      .getByLabel("96% de compatibilidade do seu perfil com esta vaga"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Carta de apresentação", exact: true }).click();
  await expect(page.getByTestId("job-composer").last()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Seu contexto para a carta" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar preparação", exact: true }).last().click();
  await expect(page.getByRole("textbox", { name: "Seu contexto para a carta" })).toHaveCount(0);
  await page.getByRole("button", { name: "Currículo personalizado", exact: true }).click();
  await expect(page.getByTestId("job-composer").last()).toBeVisible();
  await expect(page.getByText("O que você quer preparar?", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Fechar preparação", exact: true }).last().click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sobre a vaga" })).toBeVisible();
  expect(
    fixture.calls.some((call: { path: string }) =>
      call.path.endsWith(`/jobs/external/${fixture.id(1)}`),
    ),
  ).toBeTruthy();
  expect(
    fixture.calls
      .filter((call: { path: string }) => call.path.endsWith("/match/batch"))
      .every(
        (call: { body: { resumeId: string; jobIds: string[] } }) =>
          call.body.resumeId === fixture.id(700) && call.body.jobIds.length <= 20,
      ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Remover dos salvos", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salvar vaga", exact: true })).toBeVisible();
  await page.goto("/jobs");
  await expect(page.locator("#carousel-recent")).toContainText("Senior Frontend Engineer");
  await expect(
    page.locator("#carousel-recent").getByRole("button", { name: "Salvar vaga", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("guided import, minimum context, real version references, edited letter and board persist", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page);
  await openJobs(page);
  const composer = page.getByTestId("job-composer");
  await composer
    .getByRole("textbox", { name: "Link ou descrição da vaga" })
    .fill("https://example.test/opportunity");
  await composer.getByRole("button", { name: "Continuar", exact: true }).click();
  await composer.getByRole("button", { name: "Carta de apresentação", exact: true }).click();
  await composer
    .getByRole("textbox", { name: "Seu contexto para a carta" })
    .fill("Quero contribuir.");
  await expect(
    composer.getByRole("button", { name: "Criar carta de apresentação" }),
  ).toBeDisabled();
  const context =
    "Tenho experiência com React e TypeScript e me interesso pela oportunidade de construir interfaces acessíveis. Quero colaborar com a equipe, aprender com os desafios do produto e contribuir com minha experiência em aplicações web e design de interação.";
  await composer.getByRole("textbox", { name: "Seu contexto para a carta" }).fill(context);
  await composer.getByRole("button", { name: "Criar carta de apresentação" }).click();
  await expect(composer.getByText("Olá, equipe!", { exact: false })).toBeVisible();
  const tailoring = fixture.calls.filter((call: { path: string }) => call.path.endsWith("/tailor"));
  expect(tailoring).toHaveLength(1);
  expect(tailoring[0].path).toContain(fixture.id(700));
  expect(tailoring[0].body.candidateContext).toBe(context);
  expect(tailoring[0].body.jobDescription).not.toContain(context);
  await composer.getByRole("button", { name: "Editar", exact: true }).click();
  const edited = "Olá, equipe! Esta é a minha carta revisada e salva para esta oportunidade.";
  await composer.getByRole("textbox", { name: "Texto do documento" }).fill(edited);
  await composer.getByRole("button", { name: "Salvar na candidatura", exact: true }).click();
  await expect(composer.getByText(edited)).toBeVisible();
  await composer.getByRole("button", { name: "Voltar", exact: true }).click();
  await composer.getByRole("button", { name: "Currículo personalizado", exact: true }).click();
  await expect(composer.getByRole("heading", { name: "Revisar a personalização" })).toBeVisible();
  expect(
    fixture.calls.filter((call: { path: string }) => call.path.endsWith("/tailor")),
  ).toHaveLength(1);
  await composer.getByRole("button", { name: "Baixar CV (PDF)", exact: true }).click();
  await expect
    .poll(
      () =>
        fixture.calls.filter((call: { path: string }) => call.path.endsWith("/export/resume/pdf"))
          .length,
    )
    .toBe(1);
  await page.getByRole("tab", { name: "Candidaturas", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Alterar etapa — Frontend Engineer" }),
  ).toHaveValue("ready");
  await page
    .getByRole("combobox", { name: "Alterar etapa — Frontend Engineer" })
    .selectOption("interview");
  await expect
    .poll(() =>
      Object.values(fixture.state).some(
        (entry: unknown) => (entry as { stage?: string }).stage === "interview",
      ),
    )
    .toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Alterar etapa — Frontend Engineer" }),
  ).toHaveValue("interview");
  await page.getByRole("link", { name: "Frontend Engineer", exact: true }).click();
  await expect(page.getByText("Seus documentos", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Carta de apresentação", exact: true }).last().click();
  await expect(page.getByTestId("job-composer").getByText(edited)).toBeVisible();
  expect(
    fixture.calls.some(
      (call: { path: string; method: string }) =>
        call.path.endsWith("/jobs") && call.method === "POST",
    ),
  ).toBeFalsy();
});

test("failed bookmarks roll back and typed descriptions survive reload without importing a URL", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page);
  await page.route("**/jobs/external/*/save", (route) =>
    route.fulfill({ status: 503, json: { message: "Temporary failure" } }),
  );
  await openJobs(page);
  const card = page.locator("#carousel-recommended").getByTestId(`opportunity-${fixture.id(1)}`);
  await card.getByRole("button", { name: "Salvar vaga", exact: true }).click();
  await expect(
    page.getByText("Não foi possível salvar. Tente novamente.", { exact: true }).first(),
  ).toBeVisible();
  await expect(card.getByRole("button", { name: "Salvar vaga", exact: true })).toBeVisible();
  const description =
    "Desenvolvedor Frontend\nBuscamos experiência com React, TypeScript, testes automatizados e acessibilidade para construir interfaces web.";
  await page.getByRole("textbox", { name: "Link ou descrição da vaga" }).fill(description);
  await expect.poll(() => fixture.state["jobs.v2.composer"]?.input).toBe(description);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Link ou descrição da vaga" })).toHaveValue(
    description,
  );
  await page
    .getByTestId("job-composer")
    .getByRole("button", { name: "Continuar", exact: true })
    .click();
  await expect(page.getByText("O que você quer preparar?", { exact: true })).toBeVisible();
  expect(
    fixture.calls.filter((call: { path: string }) => call.path.endsWith("/import-from-url")),
  ).toHaveLength(0);
});

test("catalog fallback paginates and saved jobs remain available with discovery filters", async ({
  page,
}) => {
  await mockJobsBackend(page, { recommended: false });
  await openJobs(page);
  await page.getByRole("button", { name: "Ver tudo em Recomendadas para você" }).click();
  await expect(page.locator('[data-testid^="opportunity-"]')).toHaveCount(20);
  await page.getByRole("button", { name: "Carregar mais vagas", exact: true }).click();
  await expect(page.locator('[data-testid^="opportunity-"]')).toHaveCount(25);
  await expect(page.getByRole("button", { name: "Carregar mais vagas", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("textbox", { name: "Cargo, empresa ou competência" }).fill("No such job");
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page.getByText("Nenhuma vaga com esses filtros.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /Salvas/ }).click();
  await expect(page.locator('[data-testid^="opportunity-"]')).toHaveCount(2);
});

test("English and dark theme do not substitute another resume when the master is missing", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page, { master: false, locale: "en" });
  await page.emulateMedia({ colorScheme: "dark" });
  await openJobs(page);
  await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  await expect(page.locator("#carousel-recommended")).not.toContainText("%");
  await page
    .getByRole("textbox", { name: "Job link or description" })
    .fill(
      "Frontend Engineer\nWe are hiring an engineer to build accessible interfaces with React and TypeScript.",
    );
  await page
    .getByTestId("job-composer")
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(
    page.getByText("Complete your master resume to prepare documents for this job.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Tailored resume", exact: true })).toBeDisabled();
  expect(
    fixture.calls.filter(
      (call: { path: string }) =>
        call.path.endsWith("/match/batch") || call.path.endsWith("/tailor"),
    ),
  ).toHaveLength(0);
});
