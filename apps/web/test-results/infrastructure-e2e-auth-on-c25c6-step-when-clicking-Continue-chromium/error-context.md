# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/onboarding.spec.ts >> Onboarding page >> Authenticated (fresh user) >> should advance to next step when clicking Continue
- Location: test/infrastructure/e2e/auth/onboarding.spec.ts:167:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h2')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "patchcareers" [ref=e7] [cursor=pointer]:
        - /url: /
      - button "E" [ref=e10]:
        - generic [ref=e11]: E
        - img [ref=e12]
  - main [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - heading "Crie seu currículo profissional" [level=1] [ref=e17]
        - paragraph [ref=e18]: Em apenas 5 minutos
      - button "Começar agora →" [ref=e19]
      - paragraph [ref=e20]: Seu progresso é salvo automaticamente
```

# Test source

```ts
  71  | 
  72  | 			await page.goto('/onboarding');
  73  | 			await page.waitForTimeout(3000);
  74  | 
  75  | 			expect(jsErrors).toHaveLength(0);
  76  | 			const networkErrors = consoleErrors.filter(
  77  | 				(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
  78  | 			);
  79  | 			expect(networkErrors).toHaveLength(0);
  80  | 			await page.close();
  81  | 		});
  82  | 
  83  | 		test('should display onboarding title and subtitle', async () => {
  84  | 			const page = await authContext.newPage();
  85  | 			await page.goto('/onboarding');
  86  | 
  87  | 			const h2 = page.locator('h2');
  88  | 			await expect(h2).toBeVisible({ timeout: 10000 });
  89  | 			const text = await h2.textContent();
  90  | 			expect(text?.length).toBeGreaterThan(0);
  91  | 			await page.close();
  92  | 		});
  93  | 
  94  | 		test('should display sidebar with steps on desktop', async () => {
  95  | 			const page = await authContext.newPage();
  96  | 			await page.setViewportSize({ width: 1280, height: 800 });
  97  | 			await page.goto('/onboarding');
  98  | 
  99  | 			const sidebar = page.locator('aside');
  100 | 			await expect(sidebar).toBeVisible({ timeout: 10000 });
  101 | 
  102 | 			const stepButtons = sidebar.locator('button');
  103 | 			const count = await stepButtons.count();
  104 | 			expect(count).toBeGreaterThan(0);
  105 | 			await page.close();
  106 | 		});
  107 | 
  108 | 		test('should display progress bar in sidebar', async () => {
  109 | 			const page = await authContext.newPage();
  110 | 			await page.setViewportSize({ width: 1280, height: 800 });
  111 | 			await page.goto('/onboarding');
  112 | 
  113 | 			const sidebar = page.locator('aside');
  114 | 			await expect(sidebar).toBeVisible({ timeout: 10000 });
  115 | 
  116 | 			// Progress text (e.g. "0% completo")
  117 | 			const progressText = sidebar.locator('span').first();
  118 | 			await expect(progressText).toBeVisible();
  119 | 			await page.close();
  120 | 		});
  121 | 
  122 | 		test('should hide sidebar on mobile', async () => {
  123 | 			const page = await authContext.newPage();
  124 | 			await page.setViewportSize({ width: 375, height: 667 });
  125 | 			await page.goto('/onboarding');
  126 | 
  127 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  128 | 
  129 | 			const sidebar = page.locator('aside');
  130 | 			await expect(sidebar).not.toBeVisible();
  131 | 			await page.close();
  132 | 		});
  133 | 
  134 | 		test('should display current step label', async () => {
  135 | 			const page = await authContext.newPage();
  136 | 			await page.goto('/onboarding');
  137 | 
  138 | 			const stepTitle = page.locator('h2');
  139 | 			await expect(stepTitle).toBeVisible({ timeout: 10000 });
  140 | 			const text = await stepTitle.textContent();
  141 | 			expect(text?.length).toBeGreaterThan(0);
  142 | 			await page.close();
  143 | 		});
  144 | 
  145 | 		test('should display Continue button', async () => {
  146 | 			const page = await authContext.newPage();
  147 | 			await page.goto('/onboarding');
  148 | 
  149 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  150 | 
  151 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  152 | 			await expect(nextBtn).toBeVisible();
  153 | 			await page.close();
  154 | 		});
  155 | 
  156 | 		test('should not display Back button on first step', async () => {
  157 | 			const page = await authContext.newPage();
  158 | 			await page.goto('/onboarding');
  159 | 
  160 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  161 | 
  162 | 			const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
  163 | 			await expect(backBtn).not.toBeVisible();
  164 | 			await page.close();
  165 | 		});
  166 | 
  167 | 		test('should advance to next step when clicking Continue', async () => {
  168 | 			const page = await authContext.newPage();
  169 | 			await page.goto('/onboarding');
  170 | 
> 171 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
      |                                     ^ Error: expect(locator).toBeVisible() failed
  172 | 			const firstTitle = await page.locator('h2').textContent();
  173 | 
  174 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  175 | 			await nextBtn.click();
  176 | 
  177 | 			await page.waitForFunction(
  178 | 				(prev) => document.querySelector('h2')?.textContent !== prev,
  179 | 				firstTitle,
  180 | 				{ timeout: 10000 }
  181 | 			);
  182 | 
  183 | 			const secondTitle = await page.locator('h2').textContent();
  184 | 			expect(secondTitle).not.toBe(firstTitle);
  185 | 			await page.close();
  186 | 		});
  187 | 
  188 | 		test('should show Back button after advancing', async () => {
  189 | 			const page = await authContext.newPage();
  190 | 			await page.goto('/onboarding');
  191 | 
  192 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  193 | 
  194 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  195 | 			await nextBtn.click();
  196 | 
  197 | 			const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
  198 | 			await expect(backBtn).toBeVisible({ timeout: 10000 });
  199 | 			await page.close();
  200 | 		});
  201 | 
  202 | 		test('should navigate back to previous step', async () => {
  203 | 			const page = await authContext.newPage();
  204 | 			await page.goto('/onboarding');
  205 | 
  206 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  207 | 
  208 | 			// Ensure we can go forward first (advance if possible)
  209 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  210 | 			if (await nextBtn.isVisible()) {
  211 | 				const titleBefore = await page.locator('h2').textContent();
  212 | 				await nextBtn.click();
  213 | 				await page.waitForTimeout(2000);
  214 | 
  215 | 				// Now go back
  216 | 				const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
  217 | 				if (await backBtn.isVisible()) {
  218 | 					const titleAfterAdvance = await page.locator('h2').textContent();
  219 | 					await backBtn.click();
  220 | 					await page.waitForFunction(
  221 | 						(afterAdvance) => document.querySelector('h2')?.textContent !== afterAdvance,
  222 | 						titleAfterAdvance,
  223 | 						{ timeout: 10000 }
  224 | 					);
  225 | 					const titleAfterBack = await page.locator('h2').textContent();
  226 | 					expect(titleAfterBack).not.toBe(titleAfterAdvance);
  227 | 				}
  228 | 			}
  229 | 			await page.close();
  230 | 		});
  231 | 
  232 | 		test('should render step content even when no dynamic fields exist', async () => {
  233 | 			const page = await authContext.newPage();
  234 | 			await page.goto('/onboarding');
  235 | 
  236 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  237 | 
  238 | 			// The current step should have a title (h2) and either:
  239 | 			// - form fields (input/textarea/select) for generic-section steps
  240 | 			// - or just the step label for steps without dynamic fields (welcome, personal-info, etc.)
  241 | 			const stepTitle = await page.locator('h2').textContent();
  242 | 			expect(stepTitle?.length).toBeGreaterThan(0);
  243 | 
  244 | 			// The Continue button should always be present
  245 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue|concluir|complete/i });
  246 | 			await expect(nextBtn).toBeVisible();
  247 | 
  248 | 			await page.close();
  249 | 		});
  250 | 
  251 | 		test('should bind input values on form steps', async () => {
  252 | 			const page = await authContext.newPage();
  253 | 			await page.goto('/onboarding');
  254 | 
  255 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  256 | 
  257 | 			// Advance past intro step
  258 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  259 | 			await nextBtn.click();
  260 | 			await page.waitForTimeout(2000);
  261 | 
  262 | 			const input = page.locator('input').first();
  263 | 			if (await input.isVisible()) {
  264 | 				await input.fill('E2E Value');
  265 | 				const value = await input.inputValue();
  266 | 				expect(value).toBe('E2E Value');
  267 | 			}
  268 | 			await page.close();
  269 | 		});
  270 | 	});
  271 | });
```