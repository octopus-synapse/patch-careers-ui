const id = (i) => `01900000-0000-7000-a000-${String(i).padStart(12, "0")}`;
const now = new Date().toISOString();
const companies = [
  "Linear",
  "Vercel",
  "Conta Simples",
  "GitHub",
  "Nubank",
  "iFood",
  "Mercado Livre",
  "Loft",
];
const domains = [
  "linear.app",
  "vercel.com",
  "contasimples.com",
  "github.com",
  "nubank.com.br",
  "ifood.com.br",
  "mercadolivre.com.br",
  "loft.com.br",
];
const titles = [
  "Senior Frontend Engineer",
  "Design Engineer",
  "Full Stack Developer",
  "Software Engineer",
  "Frontend Platform Engineer",
  "Product Designer",
  "Frontend Developer",
  "Product Engineer",
];
const jobs = Array.from({ length: 25 }, (_, i) => ({
  id: id(i + 1),
  externalId: `ext-${i + 1}`,
  title: titles[i % 8] + (i > 7 ? ` ${i + 1}` : ""),
  company: companies[i % 8],
  companyDomain: domains[i % 8],
  location: i % 2 ? "São Paulo" : "Global",
  isRemote: i % 2 === 0,
  workMode: i % 2 ? "HYBRID" : "REMOTE",
  employmentType: "FULL_TIME",
  applyUrl: `https://example.test/careers/${i + 1}`,
  publisher: null,
  description:
    "Build thoughtful software with TypeScript, React and Node.js. Work with a small team designing accessible experiences and products. Collaborate with engineers and designers. The company discloses salary only here in the original posting.",
  postedAt: now,
  fetchedAt: now,
  isSaved: i === 2 || i === 4,
  savedId: i === 2 || i === 4 ? id(i + 100) : null,
}));
exports.mockJobsBackend = async (
  page,
  { master = true, locale = "pt-BR", recommended = true } = {},
) => {
  const state = {};
  const saved = new Map(jobs.filter((j) => j.isSaved).map((j) => [j.externalId, j.savedId]));
  const calls = [];
  await page.route("https://img.logo.dev/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="white"/><path d="M30 90 90 30M20 70 70 20M50 110 110 50" stroke="black" stroke-width="15"/></svg>',
    }),
  );
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname,
      body = request.postDataJSON();
    calls.push({ path, method: request.method(), body });
    let data;
    const user = {
      id: id(900),
      email: "design@example.test",
      name: "Enzo Patti",
      username: "enzo",
      emailVerified: true,
      isAdmin: false,
      hasCompletedOnboarding: true,
      needsEmailVerification: false,
    };
    if (path.endsWith("/auth/session")) data = { authenticated: true, user };
    else if (path.endsWith("/users/profile")) data = { ...user, photoURL: null };
    else if (path.endsWith("/users/preferences/full")) data = { preferences: { language: locale } };
    else if (path.endsWith("/chat/unread")) data = { totalUnread: 0 };
    else if (path.endsWith("/notifications/unread-count")) data = { count: 0 };
    else if (path.endsWith("/resumes/slots")) data = { used: 2, limit: 4, remaining: 2 };
    else if (path.endsWith("/resumes"))
      data = {
        items: [
          { id: id(700), title: "Master", isPrimary: master, language: "pt-BR", updatedAt: now },
          {
            id: id(701),
            title: "Higher quality non-master",
            isPrimary: false,
            language: "en",
            updatedAt: now,
          },
        ],
        total: 2,
        hasNext: false,
      };
    else if (path.endsWith("/me/ui-state")) data = { state };
    else if (path.includes("/me/ui-state/") && request.method() === "PATCH") {
      const key = decodeURIComponent(path.split("/").pop());
      state[key] = body.value;
      data = { key, value: body.value };
    } else if (path.endsWith("/jobs/recommended"))
      data = {
        items: jobs.slice(0, recommended ? 12 : 0).map((j, i) => ({
          ...j,
          isSaved: saved.has(j.externalId),
          savedId: saved.get(j.externalId) || null,
          matchScore: 96 - i * 2,
        })),
        total: 12,
        hasNext: false,
        page: 1,
      };
    else if (path.endsWith("/jobs/external")) {
      const items = jobs.filter(
        (j) =>
          (!url.searchParams.get("workMode") ||
            url.searchParams.get("workMode").split(",").includes(j.workMode)) &&
          (!url.searchParams.get("location") ||
            j.location.includes(url.searchParams.get("location"))) &&
          (!url.searchParams.get("q") ||
            [j.title, j.company, j.description]
              .join(" ")
              .toLowerCase()
              .includes(url.searchParams.get("q").toLowerCase())),
      );
      const pg = +(url.searchParams.get("page") || 1),
        limit = +(url.searchParams.get("limit") || 20);
      data = {
        items: items.slice((pg - 1) * limit, pg * limit).map((j) => ({
          ...j,
          isSaved: saved.has(j.externalId),
          savedId: saved.get(j.externalId) || null,
        })),
        total: items.length,
        page: pg,
        hasNext: pg * limit < items.length,
      };
    } else if (path.endsWith("/jobs/external/saved"))
      data = {
        items: jobs
          .filter((j) => saved.has(j.externalId))
          .map((j) => ({
            ...j,
            savedId: saved.get(j.externalId),
            listingId: j.id,
            savedAt: now,
            hasApplied: null,
            appliedAt: null,
            appliedMatchScore: null,
            appliedTailoredVersionId: null,
          })),
        total: saved.size,
        page: 1,
        hasNext: false,
      };
    else if (/\/jobs\/external\/[^/]+\/save$/.test(path)) {
      const j = jobs.find((j) => j.id === path.split("/").at(-2));
      saved.set(j.externalId, id(100 + jobs.indexOf(j)));
      data = { savedId: saved.get(j.externalId), externalId: j.externalId, alreadySaved: false };
    } else if (path.includes("/jobs/external/saved/") && request.method() === "DELETE") {
      const key = [...saved].find(([, v]) => v === path.split("/").pop())?.[0];
      saved.delete(key);
      data = { removed: true, savedId: path.split("/").pop() };
    } else if (/\/jobs\/external\/[^/]+$/.test(path)) {
      const job = jobs.find((j) => j.id === path.split("/").pop());
      if (job)
        data = {
          ...job,
          isSaved: saved.has(job.externalId),
          savedId: saved.get(job.externalId) || null,
        };
    } else if (path.endsWith("/jobs/applications/tracker")) data = { applications: [] };
    else if (path.endsWith("/jobs/applications"))
      data = { items: [], total: 0, page: 1, hasNext: false };
    else if (path.endsWith("/match/batch"))
      data = {
        scores: body.jobIds.map((jobId) => ({
          jobId,
          overallScore: 96 - jobs.findIndex((j) => j.id === jobId) * 2,
          rank: "A",
        })),
      };
    else if (path.endsWith("/jobs/import-from-url"))
      data = {
        source: body.url,
        preview: {
          title: "Frontend Engineer",
          company: "Linear",
          description: jobs[0].description,
          requirements: [],
          skills: [],
          salaryRange: null,
          applyUrl: body.url,
          location: "Global",
          remotePolicy: "REMOTE",
          jobType: "FULL_TIME",
          paymentCurrency: null,
          minEnglishLevel: null,
        },
      };
    else if (path.endsWith("/tailor"))
      data = {
        versionId: id(800),
        versionNumber: 1,
        label: "Frontend Engineer — Linear",
        jobTitle: "Frontend Engineer",
        summary: "Experienced engineer building accessible web interfaces.",
        bullets: [
          {
            id: "b1",
            original: "Built apps",
            tailored: "Built accessible applications with React.",
            highlights: ["React"],
          },
        ],
        coverLetter:
          "Olá, equipe! Tenho experiência com React e interfaces acessíveis. Quero contribuir com produtos úteis e colaborar com esta equipe.",
        changes: [],
        match: { before: 87, after: 91, estimated: true },
      };
    else if (path.endsWith("/tailored-versions")) data = { versions: [] };
    else if (path.endsWith("/export/resume/pdf"))
      data = {
        downloadUrl: "https://example.test/export/resume.pdf",
        filename: "resume.pdf",
        expiresAt: now,
      };
    else if (path.endsWith("/companies/search")) data = { companies: [] };
    else if (path.endsWith("/notifications")) data = { items: [], hasNext: false };
    else if (path.endsWith("/search/global")) data = { groups: [] };
    await route.fulfill(
      data === undefined
        ? { status: 404, json: { message: "Not in job fixture" } }
        : { json: data },
    );
  });
  return { jobs, calls, state, saved, id };
};
