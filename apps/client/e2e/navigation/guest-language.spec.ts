import { expect, test } from "@playwright/test";

test.use({ locale: "pt-BR" });

test("asks a first-time guest once and remembers the selected language", async ({ page }) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthenticated" } }),
  );

  await page.goto("/");
  const dialog = page.getByTestId("guestLanguage.dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Qual idioma você prefere?")).toBeVisible();
  await expect(page.getByTestId("guestLanguage.pt-BR")).toBeVisible();
  await expect(page.getByTestId("guestLanguage.confirm")).toContainText("Continuar neste idioma");
  const portugueseBounds = await dialog.boundingBox();
  expect(portugueseBounds?.height).toBeLessThan(550);

  await page.getByTestId("guestLanguage.en").click();
  await expect(dialog.getByText("Which language do you prefer?")).toBeVisible();
  await expect(page.getByTestId("guestLanguage.confirm")).toContainText(
    "Continue in this language",
  );
  const englishBounds = await dialog.boundingBox();
  expect(englishBounds?.height).toBe(portugueseBounds?.height);
  await page.getByTestId("guestLanguage.pt-BR").click();
  await expect(dialog.getByText("Qual idioma você prefere?")).toBeVisible();
  await expect(page.getByTestId("guestLanguage.confirm")).toContainText("Continuar neste idioma");
  await page.getByTestId("guestLanguage.en").click();
  await page.getByTestId("guestLanguage.confirm").click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("patch-careers:guest-locale-choice")))
    .toBe("en");

  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(dialog).toHaveCount(0);
});
