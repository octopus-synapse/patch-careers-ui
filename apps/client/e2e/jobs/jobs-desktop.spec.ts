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
  await expect(page.getByTestId("recommended-jobs-list")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test("desktop recommendations, filters, saved state and direct detail navigation", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openJobs(page);
  await expect(page.getByRole("link", { name: "Vagas", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Oportunidades", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Candidaturas", exact: true })).toHaveCount(0);
  await expect(
    page.getByTestId("recommended-jobs-list").locator('[data-testid^="opportunity-"]'),
  ).toHaveCount(12);
  await expect(page.getByText("Vagas semelhantes às suas salvas")).toHaveCount(0);
  await expect(page.getByText("Continue de onde parou")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver em grade" }).click();
  const gridPositions = await page.getByTestId("recommended-jobs-list").evaluate((node) =>
    [...node.querySelectorAll('[data-testid^="opportunity-"]')].slice(0, 5).map((card) => ({
      left: card.getBoundingClientRect().left,
      top: card.getBoundingClientRect().top,
    })),
  );
  expect(gridPositions[0]?.top).toBe(gridPositions[3]?.top);
  expect(gridPositions[4]?.top).toBeGreaterThan(gridPositions[0]?.top ?? 0);
  await page.getByRole("button", { name: "Ver em lista" }).click();
  const listPositions = await page.getByTestId("recommended-jobs-list").evaluate((node) =>
    [...node.querySelectorAll('[data-testid^="opportunity-"]')].slice(0, 2).map((card) => ({
      left: card.getBoundingClientRect().left,
      top: card.getBoundingClientRect().top,
    })),
  );
  expect(listPositions[0]?.left).toBe(listPositions[1]?.left);
  expect(listPositions[1]?.top).toBeGreaterThan(listPositions[0]?.top ?? 0);

  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("textbox", { name: "Localização", exact: true }).fill("São Paulo");
  await page.getByRole("button", { name: "Fechar filtros", exact: true }).last().click();
  await expect(page).not.toHaveURL(/location=/);
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Localização", exact: true })).toHaveValue("");
  await page.getByRole("textbox", { name: "Localização", exact: true }).fill("São Paulo");
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page).toHaveURL(/location=/);
  await expect(page.getByTestId("recommended-jobs-list")).not.toContainText("Global");
  await expect(page).toHaveURL(/location=/);
  await page.getByRole("button", { name: "Limpar tudo", exact: true }).first().click();
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
  await expect(page.locator("#carousel-recent")).toHaveCount(0);
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
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Candidaturas", exact: true })
    .click();
  await expect(page).toHaveURL(/\/applications$/);
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
  const card = page
    .getByTestId("recommended-jobs-list")
    .getByTestId(`opportunity-${fixture.id(1)}`);
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

test("recommended jobs show complete rows and leave only the final page incomplete", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page, { recommended: false });
  const jobs = Array.from({ length: 65 }, (_, index) => ({
    ...fixture.jobs[index % fixture.jobs.length],
    id: fixture.id(index + 1),
    externalId: `ext-${index + 1}`,
    title: `Engineer ${index + 1}`,
    matchScore: 100 - index,
  }));
  await page.route(/\/api\/v1\/jobs\/external\?/, (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 12);
    return route.fulfill({
      json: {
        items: jobs.slice((pageNumber - 1) * limit, pageNumber * limit),
        total: jobs.length,
        page: pageNumber,
        hasNext: pageNumber * limit < jobs.length,
      },
    });
  });
  await openJobs(page);
  const list = page.getByTestId("recommended-jobs-list");
  await expect(list.locator('[data-testid^="opportunity-"]')).toHaveCount(12);
  for (let pageNumber = 1; pageNumber <= 6; pageNumber++) {
    await expect(
      page.getByRole("button", { name: `Página ${pageNumber}`, exact: true }),
    ).toBeVisible();
  }
  await expect(list.getByTestId(`opportunity-${fixture.id(1)}`)).toBeVisible();
  const scrollPosition = () =>
    page.evaluate(() =>
      Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.querySelector('[data-testid="jobs-desktop"]')?.scrollTop ?? 0,
      ),
    );
  await page.getByRole("button", { name: "Próxima", exact: true }).scrollIntoViewIfNeeded();
  expect(await scrollPosition()).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect
    .poll(() => list.evaluate((node) => node.getBoundingClientRect().top))
    .toBeLessThan(150);
  expect(await list.evaluate((node) => node.getBoundingClientRect().top)).toBeGreaterThan(0);
  expect(await scrollPosition()).toBeGreaterThan(0);
  await expect(list.locator('[data-testid^="opportunity-"]')).toHaveCount(12);
  await expect(list.getByTestId(`opportunity-${fixture.id(13)}`)).toBeVisible();
  await page.getByRole("button", { name: "Página 6", exact: true }).click();
  await expect(list.locator('[data-testid^="opportunity-"]')).toHaveCount(5);
  await expect(list.getByTestId(`opportunity-${fixture.id(65)}`)).toBeVisible();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await expect(list.getByTestId(`opportunity-${fixture.id(49)}`)).toBeVisible();
});

test("catalog fallback paginates and saved jobs remain available with discovery filters", async ({
  page,
}) => {
  await mockJobsBackend(page, { recommended: false });
  await openJobs(page);
  await expect(
    page.getByTestId("recommended-jobs-list").locator('[data-testid^="opportunity-"]'),
  ).toHaveCount(12);
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(
    page.getByTestId("recommended-jobs-list").locator('[data-testid^="opportunity-"]'),
  ).toHaveCount(12);
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("textbox", { name: "Cargo, empresa ou competência" }).fill("No such job");
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(
    page.getByText("Nenhuma vaga com esses filtros.", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Salvas/ }).click();
  await expect(page.locator('[data-testid^="opportunity-"]')).toHaveCount(2);
});

test("English Applications page returns to Jobs without changing its heading", async ({ page }) => {
  await mockJobsBackend(page, { locale: "en" });
  await page.goto("/en/applications");
  await expect(page.getByTestId("applications-desktop")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Applications", exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Applications" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("link", { name: "Jobs", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/jobs$/);
  await expect(page.getByRole("heading", { name: "Jobs", exact: true })).toBeVisible();
  await expect(page.getByText("Find your place. Build your future.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Opportunities", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Saved", exact: true })).toBeVisible();
});

test("English and dark theme do not substitute another resume when the master is missing", async ({
  page,
}) => {
  const fixture = await mockJobsBackend(page, { master: false, locale: "en" });
  await page.emulateMedia({ colorScheme: "dark" });
  await openJobs(page);
  await expect(page.getByRole("link", { name: "Jobs", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Opportunities", exact: true })).toBeVisible();
  await expect(page.getByText("Find your place. Build your future.")).toBeVisible();
  await expect(page.getByTestId("recommended-jobs-list")).not.toContainText("%");
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
