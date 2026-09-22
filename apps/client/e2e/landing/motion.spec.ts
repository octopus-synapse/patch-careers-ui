import { expect, type Locator, type Page, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

async function openLanding(page: Page, hash = "") {
  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
  );
  await page.goto(`/en${hash}`);
  await expect(page.getByTestId("landing-scroll-viewport")).toBeVisible();
  await expect(page.getByTestId("landing-boot-overlay")).toHaveCount(0);
}

async function opacity(element: Locator) {
  return element.evaluate((el) => Number(getComputedStyle(el).opacity));
}

test("the entire manifesto reveals individual letters with scroll and conceals them on reverse", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await openLanding(page, "#manifesto");
  const host = page.getByTestId("landing-scroll-viewport");
  const start = await host.evaluate((el) => el.scrollTop);
  const letters = page.getByTestId("landing-manifesto-letter");
  await expect(letters).toHaveCount(17);
  expect((await letters.allTextContents()).join("")).toBe("Youaresomuchmore.");
  for (const letter of await letters.all()) await expect(letter).toBeHidden();

  // Partway through the FIRST word: Y is complete, o is appearing, u is still hidden.
  await host.evaluate((el, top) => {
    el.scrollTop = top + 108;
  }, start);
  await expect(letters.nth(0)).toHaveCSS("opacity", "1");
  await expect(letters.nth(0)).toBeVisible();
  await expect.poll(() => opacity(letters.nth(1))).toBeGreaterThan(0);
  await expect.poll(() => opacity(letters.nth(1))).toBeLessThan(1);
  for (const letter of (await letters.all()).slice(2)) await expect(letter).toBeHidden();

  // The second line continues the same timeline, character by character.
  await host.evaluate((el, top) => {
    el.scrollTop = top + 500;
  }, start);
  await expect(letters.nth(6)).toHaveCSS("opacity", "1");
  await expect.poll(() => opacity(letters.nth(7))).toBeGreaterThan(0);
  await expect.poll(() => opacity(letters.nth(7))).toBeLessThan(1);
  for (const letter of (await letters.all()).slice(8)) await expect(letter).toBeHidden();

  await host.evaluate((el, top) => {
    el.scrollTop = top + 1215;
  }, start);
  for (const letter of await letters.all()) {
    await expect(letter).toBeVisible();
    await expect(letter).toHaveCSS("opacity", "1");
    await expect(letter).toHaveCSS("filter", "blur(0px)");
  }
  await host.evaluate((el, top) => {
    el.scrollTop = top;
  }, start);
  for (const letter of await letters.all()) await expect(letter).toBeHidden();
});

test("surface springs settle after pointer exit and the hero CTA still navigates", async ({
  page,
}) => {
  await openLanding(page);
  const plane = page.getByTestId("landing-depth-plane");
  const box = await plane.boundingBox();
  if (!box) throw new Error("Hero surface should have a visible bounding box");
  const original = await plane.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.2);
  await expect
    .poll(() => plane.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(original);
  await page.mouse.move(20, 160);
  await expect.poll(() => plane.evaluate((el) => getComputedStyle(el).transform)).toBe(original);
  await page.getByRole("button", { name: "See my resume for this job", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/auth/);
});

test("reduced motion reveals the full manifesto immediately, including on mobile", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await openLanding(page, "#manifesto");
  const letters = page.getByTestId("landing-manifesto-letter");
  await expect(letters).toHaveCount(17);
  for (const letter of await letters.all()) {
    await expect(letter).toHaveCSS("opacity", "1");
    await expect(letter).toHaveCSS("filter", "blur(0px)");
  }
  const heading = page.getByRole("heading", { name: "You are so much more." });
  const box = await heading.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
