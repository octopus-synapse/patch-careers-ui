# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/profile/resume-download.spec.ts >> Resume PDF Download >> browser download button works on profile page
- Location: test/infrastructure/e2e/profile/resume-download.spec.ts:99:2

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "patchcareers" [ref=e7] [cursor=pointer]:
          - /url: /
        - button "D" [ref=e10]:
          - generic [ref=e11]: D
          - img [ref=e12]
    - main [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - heading "Crie seu currículo profissional" [level=1] [ref=e17]
          - paragraph [ref=e18]: Em apenas 5 minutos
        - button "Começar agora →" [ref=e19]
        - paragraph [ref=e20]: Seu progresso é salvo automaticamente
  - generic [ref=e21]: Onboarding
```

# Test source

```ts
  30  | 			method: 'POST',
  31  | 			headers: { 'Content-Type': 'application/json' },
  32  | 			body: JSON.stringify({ email: user.email, password: user.password })
  33  | 		});
  34  | 		const setCookie = loginRes.headers.get('set-cookie') ?? '';
  35  | 		const match = setCookie.match(/session=([^;]+)/);
  36  | 		sessionCookie = match?.[1] ?? '';
  37  | 
  38  | 		// Get enzoferracini's userId from public profile
  39  | 		const profileRes = await fetch(`${API_URL}/api/v1/users/enzoferracini/profile`);
  40  | 		const profileData = await profileRes.json();
  41  | 		targetUserId = profileData.data?.user?.id;
  42  | 	});
  43  | 
  44  | 	test('public profile endpoint returns user data with id', async () => {
  45  | 		expect(targetUserId).toBeTruthy();
  46  | 		console.log('Target userId:', targetUserId);
  47  | 	});
  48  | 
  49  | 	test('download endpoint returns 401 without auth', async () => {
  50  | 		const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`);
  51  | 		expect(res.status).toBe(401);
  52  | 	});
  53  | 
  54  | 	test('download endpoint returns PDF data with JWT auth', async () => {
  55  | 		const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`, {
  56  | 			headers: { Authorization: `Bearer ${accessToken}` }
  57  | 		});
  58  | 		const body = await res.json();
  59  | 
  60  | 		expect(res.status).toBe(200);
  61  | 		expect(body.success).toBe(true);
  62  | 		expect(body.data?.pdf).toBeTruthy();
  63  | 		expect(body.data?.filename).toBe('resume.pdf');
  64  | 	});
  65  | 
  66  | 	test('generated PDF must be exactly 1 page', async () => {
  67  | 		const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`, {
  68  | 			headers: { Authorization: `Bearer ${accessToken}` }
  69  | 		});
  70  | 		const body = await res.json();
  71  | 		const pdfBase64 = body.data?.pdf as string;
  72  | 		expect(pdfBase64).toBeTruthy();
  73  | 
  74  | 		const pdfText = atob(pdfBase64);
  75  | 
  76  | 		// Count page objects in PDF: /Type /Page (not /Pages)
  77  | 		const pageMatches = pdfText.match(/\/Type\s*\/Page(?!s)/g);
  78  | 		const pageCount = pageMatches?.length ?? 0;
  79  | 
  80  | 		console.log(`PDF page count: ${pageCount}`);
  81  | 		console.log(`PDF size: ${Math.round(pdfBase64.length * 0.75 / 1024)} KB`);
  82  | 
  83  | 		expect(pageCount).toBe(1);
  84  | 	});
  85  | 
  86  | 	test('download endpoint returns PDF data with session cookie', async () => {
  87  | 		const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`, {
  88  | 			headers: { Cookie: `session=${sessionCookie}` }
  89  | 		});
  90  | 		console.log('Cookie response status:', res.status);
  91  | 		const body = await res.json();
  92  | 		console.log('Cookie response:', JSON.stringify(body).slice(0, 200));
  93  | 
  94  | 		expect(res.status).toBe(200);
  95  | 		expect(body.success).toBe(true);
  96  | 		expect(body.data?.pdf).toBeTruthy();
  97  | 	});
  98  | 
  99  | 	test('browser download button works on profile page', async ({ browser }) => {
  100 | 		// Login via browser
  101 | 		const ctx = await browser.newContext();
  102 | 		await ctx.addCookies([{
  103 | 			name: 'session',
  104 | 			value: sessionCookie,
  105 | 			domain: 'localhost',
  106 | 			path: '/',
  107 | 			httpOnly: true,
  108 | 			sameSite: 'Lax'
  109 | 		}]);
  110 | 
  111 | 		const page = await ctx.newPage();
  112 | 
  113 | 		const consoleMessages: string[] = [];
  114 | 		page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  115 | 
  116 | 		const failedRequests: string[] = [];
  117 | 		page.on('requestfailed', (req) => failedRequests.push(`${req.url()} - ${req.failure()?.errorText}`));
  118 | 
  119 | 		await page.goto('/@enzoferracini', { waitUntil: 'networkidle' });
  120 | 
  121 | 		// Check download button exists
  122 | 		const downloadBtn = page.locator('button', { hasText: 'Download' });
  123 | 		const btnVisible = await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false);
  124 | 
  125 | 		if (!btnVisible) {
  126 | 			console.log('Download button not visible. Console:', consoleMessages.filter(m => m.includes('error') || m.includes('Error')));
  127 | 			console.log('Failed requests:', failedRequests);
  128 | 		}
  129 | 
> 130 | 		expect(btnVisible).toBe(true);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  131 | 
  132 | 		// Click download
  133 | 		await downloadBtn.click();
  134 | 
  135 | 		// Wait for download to process
  136 | 		await page.waitForTimeout(5000);
  137 | 
  138 | 		// Check for error message
  139 | 		const errorText = await page.locator('text=Failed').isVisible().catch(() => false);
  140 | 		if (errorText) {
  141 | 			console.log('Download error visible. Console errors:', consoleMessages.filter(m => m.includes('error') || m.includes('Error')));
  142 | 		}
  143 | 
  144 | 		expect(errorText).toBe(false);
  145 | 
  146 | 		await ctx.close();
  147 | 	});
  148 | });
  149 | 
```