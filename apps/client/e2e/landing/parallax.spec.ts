import { expect, type Page, test } from "@playwright/test";

test.use({ locale: "pt-BR", viewport: { width: 1440, height: 900 } });

async function openLanding(page: Page, hash = "") {
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
  );
  await page.goto(`/${hash}`);
  await expect(page.getByTestId("landing-scroll-viewport")).toBeVisible();
}
async function chapter(page: Page, index: number, label: string) {
  await page.getByRole("link", { name: `Ir para ${label}`, exact: true }).click();
  await expect(page.getByTestId("landing-deck")).toHaveAttribute(
    "data-active-chapter",
    String(index),
  );
  await expect
    .poll(async () =>
      Math.abs((await page.getByTestId(`landing-chapter-${index}`).boundingBox())?.y ?? 999),
    )
    .toBeLessThan(1);
}
async function scrollTo(page: Page, value: number) {
  await page.getByTestId("landing-scroll-viewport").evaluate((el, top) => {
    el.scrollTop = top;
  }, value);
}

test("the opening is visible and scrolling only keeps neighbouring scenes mounted", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openLanding(page);
  await expect(page.locator("h1 span").first()).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-testid^="landing-cinema-surface-"]')).toHaveCount(2);
  await chapter(page, 7, "A Camila");
  await expect(page.locator('[data-testid^="landing-cinema-surface-"]')).toHaveCount(3);
  await expect(page.getByTestId("landing-chapter-0")).toHaveCount(0);
  await chapter(page, 14, "Sua nota");
  await expect(page.locator('[data-testid^="landing-cinema-surface-"]')).toHaveCount(2);
  await chapter(page, 0, "Você é bom");
  await expect(page.locator("h1 span").first()).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});

test("the discovery reveals its payoff only after assembly and reverses with scroll", async ({
  page,
}) => {
  await openLanding(page, "#connection");
  await expect(page.getByTestId("landing-deck")).toHaveAttribute("data-active-chapter", "13");
  const host = page.getByTestId("landing-scroll-viewport");
  const start = await host.evaluate((el) => el.scrollTop);
  const payoff = page.getByTestId("landing-connection-payoff");
  await expect(payoff).toHaveCSS("opacity", "0");
  const part = page.getByTestId("landing-puzzle-plane-0");
  const initial = await part.evaluate((el) => getComputedStyle(el).transform);
  await scrollTo(page, start + 600);
  await expect.poll(() => part.evaluate((el) => getComputedStyle(el).transform)).not.toBe(initial);
  await expect(payoff).toHaveCSS("opacity", "0");
  await scrollTo(page, start + 1350);
  await expect(payoff).toHaveCSS("opacity", "1");
  await expect(
    page.getByTestId("landing-spectacle-connection").getByTestId("landing-cinema-caption"),
  ).toHaveCSS("opacity", "1");
  await scrollTo(page, start);
  await expect(payoff).toHaveCSS("opacity", "0");
  await expect.poll(() => part.evaluate((el) => getComputedStyle(el).transform)).toBe(initial);
});

test("mobile and reduced motion keep the full content reachable", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    locale: "pt-BR",
  });
  const page = await context.newPage();
  await openLanding(page, "#connection");
  await expect(page.getByTestId("landing-connection-payoff")).toHaveCSS("opacity", "1");
  const host = page.getByTestId("landing-scroll-viewport");
  await host.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(page.getByTestId("landing-deck")).toHaveAttribute("data-active-chapter", "14");
  await expect(page.getByTestId("landing-chapter-14")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
