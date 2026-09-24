import { expect, test } from "@playwright/test";

const { mockJobsBackend } = require("./fixtures.cjs");

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });

test("mobile jobs shares discovery and exposes applications as a bottom tab", async ({ page }) => {
  await mockJobsBackend(page);
  await page.goto("/jobs");
  await expect(page.getByTestId("jobs-mobile")).toBeVisible();
  await expect(
    page.getByText("Encontre seu próximo passo. Cuide de cada oportunidade."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Filtros", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver em grade" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Buscar pessoas ou vagas..." })).toHaveCount(0);
  await page.getByRole("button", { name: "Candidaturas", exact: true }).last().click();
  await expect(page).toHaveURL(/\/applications/);
  await expect(page.getByTestId("applications-mobile")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mensagens", exact: true })).toHaveCount(0);
});

test("tablet compact mode offers a two-column grid", async ({ page }) => {
  await mockJobsBackend(page);
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto("/jobs");
  await expect(page.getByTestId("jobs-mobile")).toBeVisible();
  await page.getByRole("button", { name: "Ver em grade" }).click();
  const cards = page.locator('[data-testid^="opportunity-"]');
  await expect(cards.first()).toBeVisible();
  const positions = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 2).map((node) => ({
      left: node.getBoundingClientRect().left,
      top: node.getBoundingClientRect().top,
    })),
  );
  expect(positions[0]?.top).toBe(positions[1]?.top);
  expect(positions[0]?.left).not.toBe(positions[1]?.left);
  await page.reload();
  await expect
    .poll(() =>
      cards.evaluateAll((nodes) =>
        nodes.slice(0, 2).map((node) => node.getBoundingClientRect().top),
      ),
    )
    .toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number)]));
  const restored = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 2).map((node) => node.getBoundingClientRect().top),
  );
  expect(restored[0]).toBe(restored[1]);
});
