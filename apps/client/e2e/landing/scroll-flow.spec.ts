import { expect, type Page, test } from "@playwright/test";

test.use({ locale: "en-US", viewport: { width: 1440, height: 1000 } });
async function navigate(page: Page, key: string) {
  await page.evaluate(
    (key) => window.dispatchEvent(new CustomEvent("patch:landing-navigate", { detail: key })),
    key,
  );
  await expect(page.getByTestId("landing-deck")).toHaveAttribute("data-active-key", key);
  await expect
    .poll(() =>
      page.locator(`.lp-scene-${key}`).evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(1);
}
test("version B advances from the hero and keeps the evidence flow concise", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByTestId("landing-deck")).toHaveAttribute("data-variant", "b");
  await expect(page.getByTestId("landing-nav-chapter")).toHaveCount(5);
  await expect(page.locator(".lp-scene-hero .lp-preview-metrics")).toHaveCount(0);
  await expect(page.locator(".lp-scene-hero")).not.toContainText("See how it works");
  await expect(page.locator(".lp-scene-hero")).not.toContainText("The same facts");
  await page.mouse.wheel(0, 100);
  await expect(page.getByTestId("landing-deck")).toHaveAttribute("data-active-key", "dor");
  for (const key of ["dor", "vivo", "interviews", "robo", "notas"]) {
    await navigate(page, key);
    const green = ["dor", "interviews", "robo"].includes(key);
    await expect(page.locator(".lp-header")).toHaveCSS(
      "background-color",
      green ? "rgb(16, 54, 41)" : "rgb(245, 244, 238)",
    );
  }
  const evidence = page
    .locator("[data-section]")
    .filter({ has: page.locator('[data-testid^="landing-statistic-"]') });
  await expect(evidence).toHaveCount(5);
  await expect(page.locator(".flow-connection")).toHaveCount(3);
  await expect(page.locator('[data-section="versions"]')).toHaveCount(0);
  await expect(page.locator('[data-section="vivo2"]')).toHaveCount(0);
  await expect(page.locator('[data-section="filter"]')).toHaveCount(0);
  await expect(page.locator('[data-section="cena"]')).toHaveCount(0);
});

test("mobile and reduced motion keep the landing readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en#vivo");
  await expect(page.getByTestId("landing-deck")).toHaveAttribute("data-active-key", "vivo");
  await expect(page.locator(".flow-connection")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await navigate(page, "robo");
  await expect(page.locator(".lp-header")).toHaveCSS("background-color", "rgb(16, 54, 41)");
  await page.keyboard.press("End");
  await expect(page.getByTestId("landing-cta-sign-up")).toBeInViewport();
});
