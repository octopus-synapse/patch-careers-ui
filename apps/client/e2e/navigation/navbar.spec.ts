import { expect, type Page, test } from "@playwright/test";

test.use({ screenshot: "only-on-failure", trace: "retain-on-failure" });

async function mockBackend(
  page: Page,
  {
    name = "Enzo Patti",
    count = 0,
    photoURL = null,
  }: {
    name?: string;
    count?: number;
    photoURL?: string | null;
  } = {},
) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const user = {
      id: "navbar-user",
      email: "enzo@example.test",
      name,
      username: "enzo",
      emailVerified: true,
      hasCompletedOnboarding: true,
      needsEmailVerification: false,
    };
    let data: unknown;
    if (path.endsWith("/auth/session")) data = { authenticated: true, user };
    else if (path.endsWith("/users/profile")) data = { ...user, photoURL };
    else if (path.endsWith("/users/preferences/full"))
      data = { preferences: { language: "pt-BR" } };
    else if (path.endsWith("/chat/unread")) data = { totalUnread: count };
    else if (path.endsWith("/notifications/unread-count")) data = { count };
    else if (path.endsWith("/resumes/slots")) data = { used: 0, limit: 4, remaining: 4 };
    else if (
      ["/resumes", "/notifications", "/chat/conversations"].some((suffix) => path.endsWith(suffix))
    ) {
      data = { items: [], hasNext: false, nextCursor: null };
    } else if (path.endsWith("/search/global")) data = { groups: [] };
    // Unrelated screens use their normal empty/error states; no request reaches a real account.
    await route.fulfill(
      data === undefined
        ? { status: 503, json: { message: "Not available in navbar fixture" } }
        : { json: data },
    );
  });
}

async function openApp(page: Page, route = "/curriculos") {
  await page.goto(route);
  await expect(page.locator("[data-app-navbar]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function expectActiveLineAligned(page: Page) {
  const active = page.locator("[data-nav-key][aria-current=page]");
  const line = active.locator("[data-nav-active-line]");
  await expect(line).toHaveCount(1);
  await expect
    .poll(async () => {
      const itemBox = await active.boundingBox();
      const lineBox = await line.boundingBox();
      return itemBox && lineBox
        ? Math.abs(itemBox.x + itemBox.width / 2 - lineBox.x - lineBox.width / 2)
        : Infinity;
    })
    .toBeLessThan(1);
}

test("v12 geometry, both themes, and narrow-web boundary", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockBackend(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 950 });
  await openApp(page);

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const expectedBg =
      colorScheme === "dark" ? "rgba(26, 25, 22, 0.68)" : "rgba(242, 241, 236, 0.68)";
    await expect(page.locator("[data-app-navbar]")).toHaveCSS("background-color", expectedBg);
    for (const width of [1024, 1199, 1200, 1440, 1920]) {
      await page.setViewportSize({ width, height: 950 });
      const bar = page.locator("[data-app-navbar]");
      await expect(bar).toHaveCSS("height", "80px");
      await expect(bar).toHaveCSS("backdrop-filter", "blur(20px)");
      const nav = page.getByRole("navigation", { name: "Navegação principal" });
      await expect(nav).toHaveCSS("width", width < 1200 ? "384px" : "420px");
      await expectActiveLineAligned(page);
      const search = await page
        .getByRole("button", { name: "Abrir busca", exact: true })
        .boundingBox();
      const tabs = await nav.boundingBox();
      const account = await page
        .getByRole("button", { name: "Abrir menu da conta — Enzo" })
        .boundingBox();
      expect(search && tabs && search.x + search.width <= tabs.x).toBeTruthy();
      expect(account && account.x + account.width <= width).toBeTruthy();
      for (const label of ["Mensagens, 0 não lidas", "Notificações, 0 não lidas"]) {
        const button = page.getByRole("button", { name: label });
        await expect(button).toHaveText("0");
        const badge = button.getByText("0", { exact: true }).locator("..");
        await expect(badge).toHaveCSS("background-color", "rgb(35, 77, 59)");
        await button.hover();
        await expect(badge).toHaveCSS("background-color", "rgb(255, 255, 255)");
        await expect(button.getByText("0", { exact: true })).toHaveCSS("color", "rgb(35, 77, 59)");
        await page.mouse.move(0, 200);
        await expect(badge).toHaveCSS("background-color", "rgb(35, 77, 59)");
      }
      await page.mouse.move(0, 200);
      await bar.screenshot({ path: testInfo.outputPath(`navbar-${colorScheme}-${width}.png`) });
    }
  }
  await page.setViewportSize({ width: 1023, height: 950 });
  await expect(page.locator("[data-app-navbar]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir busca", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("real routes, interrupted motion, history and reduced motion", async ({ page }) => {
  await mockBackend(page, { count: 105 });
  await page.setViewportSize({ width: 1440, height: 950 });
  await openApp(page);
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await nav.getByRole("link", { name: "Início", exact: true }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  await nav.getByRole("link", { name: /Eu/ }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await nav.getByRole("link", { name: "Currículos", exact: true }).click();
  await expect(page).toHaveURL(/\/curriculos$/);
  await expectActiveLineAligned(page);
  await page.goBack();
  await expect(nav.getByRole("link", { name: /Eu/ })).toHaveAttribute("aria-current", "page");
  await expectActiveLineAligned(page);
  await page.goForward();
  await expect(nav.getByRole("link", { name: "Currículos" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("link", { name: "Início" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectActiveLineAligned(page);
  await expect
    .poll(() =>
      nav.evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
      ),
    )
    .toBe(0);
  await page.setViewportSize({ width: 1024, height: 950 });
  await nav.getByRole("link", { name: "Currículos" }).click();
  await expectActiveLineAligned(page);

  await page.getByRole("button", { name: "Mensagens, 105 não lidas" }).click();
  await expect(page).toHaveURL(/\/messages$/);
  await expect(page.getByRole("button", { name: "Mensagens, 105 não lidas" })).toHaveText("99+");
  await expect(nav.locator("[data-nav-active-line]")).toHaveCount(0);
  await page.getByRole("button", { name: "Notificações, 105 não lidas" }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(nav.locator("[aria-current]")).toHaveCount(0);
  await page.goto("/resume/test-resume");
  await expect(page.locator('[data-nav-key="curriculos"]')).toHaveAttribute("aria-current", "page");
});

test("search, account keyboard navigation, and sign-out confirmation", async ({
  page,
}, testInfo) => {
  await mockBackend(page, { name: "Alexandremuitolongosemespacos Silva" });
  await page.setViewportSize({ width: 1024, height: 950 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openApp(page);
  const trigger = page.getByRole("button", { name: /Abrir menu da conta/ });
  const box = await trigger.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(180);
  await page.keyboard.press("Control+k");
  await expect(page.getByPlaceholder("Buscar…")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("Buscar…")).not.toBeVisible();
  await page.keyboard.press("Meta+k");
  await expect(page.getByPlaceholder("Buscar…")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("Buscar…")).not.toBeVisible();

  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem").first()).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("account-menu.png") });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.getByRole("menuitem", { name: /Sair da conta/ }).click();
  await expect(page.getByText("Sair da conta?", { exact: true })).toBeVisible();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.locator("[data-app-navbar]")).toBeVisible();
});
