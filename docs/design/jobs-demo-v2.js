/* Standalone, file://-compatible prototype. No production mutations or AI calls. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const STORAGE_KEY = "patch.jobs-demo.v2.v3";
  const GROUPS = ["recommended", "similar", "recent"];
  const STATUSES = ["draft", "ready", "sent", "interview"];
  const emptyFilters = () => ({ location: "", mode: "", contract: "", period: "", q: "" });
  const messages = {
    pt: {
      home: "Início",
      jobs: "Vagas",
      applications: "Candidaturas",
      saved: "Salvas",
      tagline: "Encontre seu próximo passo. Cuide de cada oportunidade.",
      master: "Seu currículo master como ponto de partida",
      recommended: "Recomendadas para você",
      similar: "Vagas semelhantes às suas salvas",
      recent: "Continue de onde parou",
      composerTitle: "Encontrou uma vaga?",
      composerHelp:
        "Cole o link ou a descrição para preparar seu currículo ou carta de apresentação.",
      inputLabel: "Link ou descrição da vaga",
      inputPlaceholder: "Cole o link ou a descrição da vaga aqui…",
      example: "Usar uma vaga de exemplo",
      continue: "Continuar",
      back: "Voltar",
      choose: "O que você quer preparar?",
      resume: "Currículo personalizado",
      letter: "Carta de apresentação",
      resumeHelp: "Sua experiência, alinhada à oportunidade.",
      letterHelp: "Uma apresentação com a sua voz.",
      changeJob: "Alterar vaga",
      newJob: "Adicionar outra vaga",
      viewJob: "Ver detalhes da vaga",
      importNotice: "Prévia ilustrativa. Confira as informações no anúncio original.",
      letterTitle: "Comece com as suas palavras.",
      letterHelpLong:
        "Por que essa vaga te interessa? Quais experiências você quer destacar? Escreva pelo menos 200 caracteres.",
      letterPlaceholder: "Essa oportunidade me interessa porque…",
      createLetter: "Criar carta de apresentação",
      remaining: "caracteres restantes",
      readyLetter: "Pronto para criar sua carta.",
      preparing: "Preparando sua vaga…",
      loadingResume: "Preparando seu currículo.",
      loadingLetter: "Preparando sua carta.",
      loadingHelp: "Já vamos abrir a prévia para você revisar.",
      edit: "Editar",
      finish: "Concluir edição",
      copy: "Copiar",
      download: "Baixar .txt",
      saveDocument: "Salvar na candidatura",
      docNotice: "Documento ilustrativo. Revise e edite antes de salvar.",
      invalidLink: "Confira o link da vaga. Use um endereço http ou https válido.",
      invalidDescription: "Cole uma descrição com pelo menos 50 caracteres.",
      location: "Localização",
      mode: "Modelo de trabalho",
      remote: "Remoto",
      hybrid: "Híbrido",
      onsite: "Presencial",
      unknownMode: "Modelo não informado",
      filters: "Filtros",
      search: "Cargo, empresa ou competência",
      clear: "Limpar filtros",
      clearOne: "Remover filtro",
      contract: "Tipo de contratação",
      period: "Publicação",
      any: "Qualquer opção",
      anyDate: "Qualquer data",
      today: "Hoje",
      week: "Últimos 7 dias",
      month: "Últimos 30 dias",
      applyFilters: "Aplicar filtros",
      close: "Fechar",
      all: "Ver todas",
      previous: "Vagas anteriores",
      next: "Próximas vagas",
      save: "Salvar vaga",
      unsave: "Remover dos salvos",
      savedToast: "Vaga salva.",
      unsavedToast: "Vaga removida dos salvos.",
      match: "de compatibilidade com seu currículo master",
      unavailable: "Compatibilidade ainda indisponível",
      count: "oportunidades",
      noResults: "Nenhuma vaga com esses filtros.",
      noResultsHelp: "Experimente outra combinação para ampliar suas possibilidades.",
      noSaved: "Suas próximas possibilidades ficam aqui.",
      noSavedHelp: "Salve uma vaga para encontrá-la aqui quando quiser.",
      noSimilar: "Suas salvas dão o próximo caminho.",
      noSimilarHelp: "Salve uma oportunidade para descobrir vagas semelhantes.",
      noSimilarMatches: "Ainda não encontramos vagas semelhantes.",
      noSimilarMatchesHelp:
        "Novas sugestões aparecerão quando houver oportunidades com competências em comum.",
      noRecent: "Um lugar para retomar sua busca.",
      noRecentHelp: "As vagas que você abrir aparecem aqui para você revisitar.",
      explore: "Encontrar vagas",
      draft: "Em preparação",
      ready: "Pronta para enviar",
      sent: "Enviada",
      interview: "Entrevista",
      noApplications: "Nenhuma candidatura nesta etapa.",
      applicationHelp: "Acompanhe cada passo, da preparação à próxima conversa.",
      changeStatus: "Alterar etapa da candidatura",
      statusSaved: "Etapa atualizada.",
      savedHelp: "As oportunidades que você quer ter por perto.",
      backJobs: "Voltar para as vagas",
      backGroup: "Voltar aos grupos",
      about: "Sobre a vaga",
      responsibilities: "O que você vai fazer",
      requirements: "O que buscamos",
      prepare: "Prepare seu próximo passo",
      original: "Ver anúncio original",
      masterLabel: "Seu currículo master",
      yourApplication: "Sua candidatura",
      documents: "Seus documentos",
      docSaved: "Documento salvo na candidatura.",
      copyDone: "Texto copiado.",
      copyFailed: "Selecione o texto da prévia para copiar.",
      notFound: "Esta vaga não está disponível.",
      notFoundHelp: "Volte para as oportunidades e continue sua busca.",
      footer: "Demo desktop · Vagas, scores e documentos ilustrativos",
      searchTitle: "Buscar vagas",
      noSearch: "Nenhuma vaga encontrada.",
      resetFilters: "Filtros aplicados aos três grupos de vagas",
      recentSaved: "Histórico atualizado",
      reviewing: "Revisar documento",
    },
    en: {
      home: "Home",
      jobs: "Jobs",
      applications: "Applications",
      saved: "Saved",
      tagline: "Find your next step. Make every opportunity count.",
      master: "Your master resume as a starting point",
      recommended: "Recommended for you",
      similar: "Jobs similar to your saved jobs",
      recent: "Pick up where you left off",
      composerTitle: "Found an opportunity?",
      composerHelp: "Paste the link or description to prepare your resume or cover letter.",
      inputLabel: "Job link or description",
      inputPlaceholder: "Paste the job link or description here…",
      example: "Try an example job",
      continue: "Continue",
      back: "Back",
      choose: "What would you like to prepare?",
      resume: "Tailored resume",
      letter: "Cover letter",
      resumeHelp: "Your experience, aligned with the opportunity.",
      letterHelp: "An introduction in your own voice.",
      changeJob: "Change job",
      newJob: "Add another job",
      viewJob: "View job details",
      importNotice: "Illustrative preview. Check the original posting for details.",
      letterTitle: "Start with your own words.",
      letterHelpLong:
        "Why does this role interest you? What experiences would you highlight? Write at least 200 characters.",
      letterPlaceholder: "This opportunity interests me because…",
      createLetter: "Create cover letter",
      remaining: "characters remaining",
      readyLetter: "Ready to create your letter.",
      preparing: "Preparing your job…",
      loadingResume: "Preparing your resume.",
      loadingLetter: "Preparing your letter.",
      loadingHelp: "Your preview will be ready to review shortly.",
      edit: "Edit",
      finish: "Finish editing",
      copy: "Copy",
      download: "Download .txt",
      saveDocument: "Save to application",
      docNotice: "Illustrative document. Review and edit before saving.",
      invalidLink: "Check the job link. Use a valid http or https address.",
      invalidDescription: "Paste a description with at least 50 characters.",
      location: "Location",
      mode: "Work model",
      remote: "Remote",
      hybrid: "Hybrid",
      onsite: "On-site",
      unknownMode: "Work model not specified",
      filters: "Filters",
      search: "Role, company or skill",
      clear: "Clear filters",
      clearOne: "Remove filter",
      contract: "Employment type",
      period: "Posted",
      any: "Any option",
      anyDate: "Any time",
      today: "Today",
      week: "Last 7 days",
      month: "Last 30 days",
      applyFilters: "Apply filters",
      close: "Close",
      all: "View all",
      previous: "Previous jobs",
      next: "Next jobs",
      save: "Save job",
      unsave: "Remove saved job",
      savedToast: "Job saved.",
      unsavedToast: "Job removed from saved.",
      match: "compatibility with your master resume",
      unavailable: "Compatibility not yet available",
      count: "opportunities",
      noResults: "No jobs match these filters.",
      noResultsHelp: "Try another combination to broaden your search.",
      noSaved: "Keep your next possibilities here.",
      noSavedHelp: "Save a job to find it here whenever you want.",
      noSimilar: "Your saved jobs point the way.",
      noSimilarHelp: "Save an opportunity to discover similar jobs.",
      noSimilarMatches: "No similar jobs just yet.",
      noSimilarMatchesHelp: "New suggestions will appear when opportunities share relevant skills.",
      noRecent: "A place to resume your search.",
      noRecentHelp: "Jobs you open will appear here so you can revisit them.",
      explore: "Find jobs",
      draft: "Preparing",
      ready: "Ready to send",
      sent: "Sent",
      interview: "Interview",
      noApplications: "No applications at this stage.",
      applicationHelp: "Follow every step, from preparation to your next conversation.",
      changeStatus: "Change application stage",
      statusSaved: "Stage updated.",
      savedHelp: "The opportunities you want to keep close.",
      backJobs: "Back to jobs",
      backGroup: "Back to groups",
      about: "About the role",
      responsibilities: "What you will do",
      requirements: "What we are looking for",
      prepare: "Prepare your next step",
      original: "View original posting",
      masterLabel: "Your master resume",
      yourApplication: "Your application",
      documents: "Your documents",
      docSaved: "Document saved to application.",
      copyDone: "Text copied.",
      copyFailed: "Select the preview text to copy.",
      notFound: "This job is not available.",
      notFoundHelp: "Return to the opportunities and keep exploring.",
      footer: "Desktop demo · Illustrative jobs, scores and documents",
      searchTitle: "Search jobs",
      noSearch: "No jobs found.",
      resetFilters: "Filters applied to all three job groups",
      recentSaved: "History updated",
      reviewing: "Review document",
    },
  };
  const freshFlow = () => ({
    stage: "input",
    input: "",
    jobId: null,
    personal: "",
    document: null,
    error: "",
    busy: false,
  });
  const initialState = () => ({
    version: 3,
    locale: "pt",
    dark: false,
    userName: "Enzo Patti",
    filters: emptyFilters(),
    saved: ["vercel", "github", "loft", "ifood", "linear"],
    imported: [],
    recent: [],
    applications: [
      { jobId: "linear", status: "draft", documents: [] },
      { jobId: "nubank", status: "interview", documents: [] },
      { jobId: "conta", status: "sent", documents: [] },
      { jobId: "vercel", status: "ready", documents: [] },
      { jobId: "meli", status: "sent", documents: [] },
    ],
    flow: freshFlow(),
  });
  const validDocument = (doc) =>
    doc &&
    typeof doc.id === "string" &&
    typeof doc.jobId === "string" &&
    ["resume", "letter"].includes(doc.type) &&
    typeof doc.text === "string" &&
    doc.text.length <= 100000;
  function loadState() {
    const base = initialState();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!raw || raw.version !== 3) return base;
      base.locale = raw.locale === "en" ? "en" : "pt";
      base.dark = raw.dark === true;
      if (typeof raw.userName === "string" && raw.userName.trim())
        base.userName = raw.userName.slice(0, 80);
      if (Array.isArray(raw.imported))
        base.imported = raw.imported
          .filter(
            (j) =>
              j &&
              typeof j.id === "string" &&
              j.id.startsWith("external-") &&
              typeof j.title === "string" &&
              typeof j.company === "string" &&
              typeof j.description === "string",
          )
          .slice(-100)
          .map((j) => ({
            ...j,
            companyDomain: null,
            masterMatchScore: null,
            tags: Array.isArray(j.tags) ? j.tags.filter((t) => typeof t === "string") : [],
            fixture: false,
          }));
      const ids = new Set([...window.PATCH_JOBS_FIXTURES, ...base.imported].map((j) => j.id));
      if (Array.isArray(raw.saved))
        base.saved = [...new Set(raw.saved.filter((id) => ids.has(id)))];
      if (Array.isArray(raw.recent))
        base.recent = raw.recent
          .filter((x) => x && ids.has(x.id) && Number.isFinite(x.at))
          .slice(0, 50);
      if (Array.isArray(raw.applications))
        base.applications = raw.applications
          .filter((a) => a && ids.has(a.jobId) && STATUSES.includes(a.status))
          .map((a) => ({
            jobId: a.jobId,
            status: a.status,
            documents: Array.isArray(a.documents)
              ? a.documents.filter((d) => validDocument(d) && d.jobId === a.jobId).slice(-20)
              : [],
          }));
      if (raw.filters)
        for (const key of Object.keys(base.filters))
          if (typeof raw.filters[key] === "string")
            base.filters[key] = raw.filters[key].slice(0, 200);
      if (raw.flow && typeof raw.flow.input === "string") {
        const f = raw.flow;
        base.flow = {
          ...freshFlow(),
          input: f.input.slice(0, 12000),
          jobId: ids.has(f.jobId) ? f.jobId : null,
          personal: typeof f.personal === "string" ? f.personal.slice(0, 3000) : "",
          document: validDocument(f.document) ? f.document : null,
        };
        if (base.flow.jobId && ["choice", "letter", "preview"].includes(f.stage))
          base.flow.stage = f.stage === "preview" && !base.flow.document ? "choice" : f.stage;
      }
    } catch {
      /* Private browsing, unavailable storage or stale demo state. */
    }
    return base;
  }
  const state = loadState();
  const t = (key) => messages[state.locale][key] ?? messages.pt[key] ?? key;
  const allJobs = () => [...window.PATCH_JOBS_FIXTURES, ...state.imported];
  const jobById = (id) => allJobs().find((job) => job.id === id);
  const applicationFor = (id) => state.applications.find((a) => a.jobId === id);
  let saveTimer,
    toastTimer,
    operation = 0,
    route,
    detailReturn = null;
  let lastRouteKey = "";
  const positions = new Map();
  const failedLogos = new Set();
  let imageObserver, scrollObserver;
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* In-memory state remains usable. */
    }
  }
  function queuePersist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 180);
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    toastTimer = setTimeout(() => {
      $("#toast").hidden = true;
    }, 2800);
  }
  const safeURL = (value) => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };
  function scoreMarkup(score) {
    const valid = typeof score === "number" && Number.isFinite(score);
    const band = !valid
      ? "none"
      : score >= 85
        ? "excellent"
        : score >= 70
          ? "good"
          : score >= 50
            ? "fair"
            : "poor";
    const value = valid ? `${Math.round(Math.min(100, Math.max(0, score)))}%` : "—";
    const label = valid ? `${value} ${t("match")}` : t("unavailable");
    return `<span class="match-score" data-band="${band}" aria-label="${esc(label)}" title="${esc(label)}">${value}</span>`;
  }
  function logoMarkup(job, large = false) {
    const domain = String(job.companyDomain || "")
      .trim()
      .toLowerCase();
    const token = window.PATCH_JOBS_DEMO_CONFIG?.logoDevPublishableKey?.trim();
    const valid = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(domain);
    const url =
      token && valid && !failedLogos.has(domain)
        ? `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128&format=png`
        : null;
    return `<span class="company-logo${large ? " large" : ""}" aria-hidden="true"><span>${esc(job.initials || job.company.slice(0, 2))}</span>${url ? `<img data-logo-src="${esc(url)}" data-domain="${esc(domain)}" width="128" height="128" decoding="async" loading="lazy" alt="">` : ""}</span>`;
  }
  function hydrateImages() {
    if (!imageObserver && "IntersectionObserver" in window)
      imageObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              const img = entry.target;
              if (!failedLogos.has(img.dataset.domain)) img.src = img.dataset.logoSrc;
              imageObserver.unobserve(img);
            }
        },
        { rootMargin: "80px" },
      );
    $$("img[data-logo-src]:not([data-observed])").forEach((img) => {
      img.dataset.observed = "true";
      img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
      img.addEventListener(
        "error",
        () => {
          failedLogos.add(img.dataset.domain);
          img.remove();
        },
        { once: true },
      );
      if (imageObserver) imageObserver.observe(img);
      else img.src = img.dataset.logoSrc;
    });
  }
  function groupJobs(group) {
    const jobs = allJobs().filter((j) => j.fixture);
    if (group === "recent") return state.recent.map((item) => jobById(item.id)).filter(Boolean);
    const rank = (a, b) =>
      (b.masterMatchScore ?? -1) - (a.masterMatchScore ?? -1) || a.id.localeCompare(b.id);
    if (group === "recommended") return jobs.sort(rank);
    const savedTags = state.saved.map((id) => new Set((jobById(id)?.tags || []).map(normalize)));
    return jobs
      .filter((j) => !state.saved.includes(j.id))
      .map((job) => ({
        job,
        overlap: Math.max(
          0,
          ...savedTags.map(
            (tags) => new Set(job.tags.map(normalize).filter((tag) => tags.has(tag))).size,
          ),
        ),
      }))
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || rank(a.job, b.job))
      .map((x) => x.job);
  }
  function filtered(jobs) {
    const f = state.filters;
    return jobs.filter(
      (j) =>
        (!f.location || j.location === f.location) &&
        (!f.mode || j.workMode === f.mode) &&
        (!f.contract || j.contract === f.contract) &&
        (!f.period || (j.daysAgo ?? 0) < Number(f.period)) &&
        (!f.q ||
          normalize([j.title, j.company, ...(j.tags || [])].join(" ")).includes(
            normalize(f.q.trim()),
          )),
    );
  }
  const filtersActive = () => Object.values(state.filters).some(Boolean);
  function filterQuery() {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(state.filters)) if (v) p.set(k, v);
    return p.size ? `?${p}` : "";
  }
  const jobsHref = () => `#/jobs${filterQuery()}`;
  const groupHref = (group) => `#/jobs/group/${group}${filterQuery()}`;
  function parseRoute() {
    const raw = location.hash.slice(1) || "/jobs";
    const [path, query = ""] = raw.split("?");
    const params = new URLSearchParams(query);
    if (path === "/jobs" || path.startsWith("/jobs/group/")) {
      state.filters = emptyFilters();
      for (const k of Object.keys(state.filters))
        state.filters[k] = (params.get(k) || "").slice(0, 200);
    }
    if (path.startsWith("/job/")) {
      let id;
      try {
        id = decodeURIComponent(path.slice(5));
      } catch {
        id = "";
      }
      return { kind: "detail", id, key: raw };
    }
    if (path.startsWith("/jobs/group/")) return { kind: "group", group: path.slice(12), key: raw };
    return {
      kind: "home",
      tab:
        path === "/jobs/candidaturas" ? "applications" : path === "/jobs/salvas" ? "saved" : "jobs",
      key: raw,
    };
  }
  function rememberPosition() {
    if (!route) return;
    positions.set(route.key, {
      y: scrollY,
      shelves: Object.fromEntries($$(".shelf-grid").map((el) => [el.dataset.group, el.scrollLeft])),
    });
  }
  function navigate(href) {
    rememberPosition();
    if (location.hash === href) renderRoute();
    else location.hash = href;
  }
  function rememberVisit(id) {
    state.recent = [{ id, at: Date.now() }, ...state.recent.filter((x) => x.id !== id)].slice(
      0,
      50,
    );
    persist();
  }
  function statusSelect(jobId, selected) {
    return `<select data-status-job="${esc(jobId)}" aria-label="${esc(t("changeStatus"))}">${STATUSES.map((s) => `<option value="${s}" ${selected === s ? "selected" : ""}>${esc(t(s))}</option>`).join("")}</select>`;
  }
  function card(job, application = null) {
    const saved = state.saved.includes(job.id);
    return `<article class="opportunity" data-card="${esc(job.id)}">
      <div class="company-line">${logoMarkup(job)}<span class="company-name">${esc(job.company)}</span></div>
      <button class="bookmark-button" data-save="${esc(job.id)}" aria-label="${esc(`${t(saved ? "unsave" : "save")}: ${job.title}`)}" aria-pressed="${saved}" title="${esc(t(saved ? "unsave" : "save"))}">${icon("bookmark")}</button>
      <h3 class="job-name"><a href="#/job/${encodeURIComponent(job.id)}" data-job-link="${esc(job.id)}" title="${esc(job.title)}">${esc(job.title)}</a></h3>
      <p class="job-meta"><span>${esc(job.location || "—")}</span><span class="meta-dot" aria-hidden="true">·</span><span>${esc(t(job.workMode || "unknownMode"))}</span></p>
      <div class="card-footer"><span class="contract">${esc(job.contract || "")}</span>${scoreMarkup(job.masterMatchScore)}</div>
      ${application ? `<div class="application-tools">${statusSelect(job.id, application.status)}</div>` : ""}
    </article>`;
  }
  function emptyMarkup(title, help, action = "") {
    return `<div class="section-empty"><h3>${esc(t(title))}</h3><p>${esc(t(help))}</p>${action}</div>`;
  }
  function groupEmpty(group) {
    const clear = `<button class="quiet-link" data-clear-filters>${esc(t("clear"))}${icon("arrow")}</button>`;
    if (filtered(groupJobs(group)).length === 0 && groupJobs(group).length > 0 && filtersActive())
      return emptyMarkup("noResults", "noResultsHelp", clear);
    if (group === "similar")
      return state.saved.length
        ? emptyMarkup("noSimilarMatches", "noSimilarMatchesHelp")
        : emptyMarkup("noSimilar", "noSimilarHelp");
    if (group === "recent") return emptyMarkup("noRecent", "noRecentHelp");
    return emptyMarkup("noResults", "noResultsHelp", filtersActive() ? clear : "");
  }
  function renderShelf(group) {
    const jobs = filtered(groupJobs(group));
    return `<section class="shelf" aria-labelledby="heading-${group}" data-shelf="${group}">
      <div class="shelf-heading"><h2 id="heading-${group}">${esc(t(group))}</h2>${jobs.length ? `<a class="see-all" href="${groupHref(group)}">${esc(t("all"))}${icon("arrow")}</a>` : ""}</div>
      ${
        jobs.length
          ? `<div class="shelf-carousel">
        <button class="carousel-arrow" data-slide="-1" data-group="${group}" aria-controls="carousel-${group}" aria-label="${esc(`${t("previous")} — ${t(group)}`)}">${icon("chevron-left")}</button>
        <div class="shelf-grid" id="carousel-${group}" data-group="${group}" tabindex="0" role="region" aria-label="${esc(t(group))}">${jobs.map((j) => card(j)).join("")}</div>
        <button class="carousel-arrow" data-slide="1" data-group="${group}" aria-controls="carousel-${group}" aria-label="${esc(`${t("next")} — ${t(group)}`)}">${icon("chevron-right")}</button>
      </div>`
          : groupEmpty(group)
      }
    </section>`;
  }
  function updateCarousel(grid) {
    const group = grid.dataset.group;
    const previous = $(`[data-slide="-1"][data-group="${group}"]`);
    const next = $(`[data-slide="1"][data-group="${group}"]`);
    if (previous) previous.disabled = grid.scrollLeft <= 2;
    if (next) next.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 2;
  }
  function bindCarousels() {
    scrollObserver?.disconnect();
    scrollObserver = new ResizeObserver((entries) =>
      entries.forEach((e) => {
        updateCarousel(e.target);
      }),
    );
    $$(".shelf-grid").forEach((grid) => {
      updateCarousel(grid);
      grid.addEventListener("scroll", () => updateCarousel(grid), { passive: true });
      scrollObserver.observe(grid);
    });
  }
  function activeFilters() {
    const f = state.filters;
    const labels = {
      location: f.location,
      mode: f.mode ? t(f.mode) : "",
      contract: f.contract,
      period: f.period ? t(f.period === "1" ? "today" : f.period === "7" ? "week" : "month") : "",
      q: f.q,
    };
    return (
      Object.entries(labels)
        .filter(([, v]) => v)
        .map(
          ([key, value]) =>
            `<button class="active-filter" data-remove-filter="${key}" aria-label="${esc(`${t("clearOne")}: ${value}`)}">${esc(value)}${icon("x")}</button>`,
        )
        .join("") +
      (filtersActive()
        ? `<button class="quiet-link" data-clear-filters>${esc(t("clear"))}</button>`
        : "")
    );
  }
  function filtersMarkup() {
    return `<div class="filters-bar" aria-label="${esc(t("resetFilters"))}">
      <button class="action filter-button" data-open-filters aria-haspopup="dialog" aria-controls="filters-dialog">${icon("sliders")}${esc(t("filters"))}</button>
      <div class="active-filters" id="active-filters" ${filtersActive() ? "" : "hidden"}>${activeFilters()}</div>
    </div>`;
  }
  function renderDiscovery() {
    const mount = $("#discovery-results");
    if (!mount) return;
    if (route.kind === "group") {
      const jobs = filtered(groupJobs(route.group));
      mount.innerHTML = `<div class="view-heading"><h2>${esc(t(route.group))}</h2><p>${jobs.length} ${esc(t("count"))}</p></div>${jobs.length ? `<div class="job-grid">${jobs.map((j) => card(j)).join("")}</div>` : groupEmpty(route.group)}`;
    } else mount.innerHTML = GROUPS.map(renderShelf).join("");
    bindCarousels();
    hydrateImages();
  }
  function applyFilters() {
    if (!route || !(route.kind === "group" || (route.kind === "home" && route.tab === "jobs")))
      return;
    const path = route.kind === "group" ? `/jobs/group/${route.group}` : "/jobs";
    history.replaceState(history.state, "", `#${path}${filterQuery()}`);
    route.key = location.hash.slice(1);
    lastRouteKey = route.key;
    $('[data-page="vagas"]').href = jobsHref();
    if (route.kind === "group")
      $("#app > #tab-panel > .back-link")?.setAttribute("href", jobsHref());
    persist();
    const chips = $("#active-filters");
    if (chips) {
      chips.innerHTML = activeFilters();
      chips.hidden = !filtersActive();
    }
    renderDiscovery();
    $("#announcement").textContent =
      `${t("resetFilters")}. ${GROUPS.reduce((n, g) => n + filtered(groupJobs(g)).length, 0)} ${t("count")}.`;
  }
  function renderFiltersDialog() {
    const locations = [
      ...new Set(
        allJobs()
          .filter((j) => j.fixture)
          .map((j) => j.location)
          .concat(state.filters.location)
          .filter(Boolean),
      ),
    ].sort();
    const select = (key, label, values) =>
      `<label class="filter-field"><span>${esc(t(label))}</span><select name="${key}">${values.map(([value, text]) => `<option value="${esc(value)}" ${state.filters[key] === value ? "selected" : ""}>${esc(text)}</option>`).join("")}</select></label>`;
    $("#filters-dialog").innerHTML =
      `<form id="filters-form"><div class="dialog-heading"><h2 id="filters-title">${esc(t("filters"))}</h2><button type="button" class="quiet-icon" data-close aria-label="${esc(t("close"))}">${icon("x")}</button></div>
      <div class="filters-grid"><label class="filter-field filter-field-wide"><span>${esc(t("search"))}</span><input type="search" name="q" maxlength="200" value="${esc(state.filters.q)}" placeholder="${esc(t("search"))}"></label>
      ${select("location", "location", [["", t("any")], ...locations.map((x) => [x, x])])}
      ${select("mode", "mode", [["", t("any")], ...["remote", "hybrid", "onsite"].map((x) => [x, t(x)])])}
      ${select("contract", "contract", [["", t("any")], ...["CLT", "PJ", "Full-time", "Estágio"].map((x) => [x, x])])}
      ${select("period", "period", [
        ["", t("anyDate")],
        ["1", t("today")],
        ["7", t("week")],
        ["30", t("month")],
      ])}</div>
      <div class="dialog-footer"><button type="button" class="quiet-link" data-clear-filter-draft>${esc(t("clear"))}</button><button class="action filter-button" type="submit">${esc(t("applyFilters"))}${icon("arrow")}</button></div></form>`;
    openDialog("filters-dialog");
  }

  function flowJob(job) {
    return `<div class="flow-job">${logoMarkup(job, true)}<div><h3>${esc(job.title)}</h3><p>${esc(job.company)}</p></div></div>`;
  }
  function resizeJobInput() {
    const input = $("#job-input");
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight + 2, 208)}px`;
  }
  function documentMarkup(text) {
    return text
      .split(/\n{2,}/)
      .map(
        (block, index) =>
          `<p class="${index === 0 ? "document-heading" : /^[A-ZÁÉÍÓÚÃÕÇ /]+\n/.test(block) ? "document-section" : ""}">${esc(block)}</p>`,
      )
      .join("");
  }
  function renderComposer(focus = "") {
    const mount = $("#composer-mount");
    if (!mount) return;
    const f = state.flow;
    const job = jobById(f.jobId);
    if (route.kind === "detail" && (f.jobId !== route.id || f.stage === "input")) {
      mount.innerHTML = "";
      return;
    }
    if (f.stage !== "input" && !job) f.stage = "input";
    let body = "";
    if (f.stage === "input") {
      body = `<div class="composer-input-layout"><div class="composer-intro"><h2>${esc(t("composerTitle"))}</h2><p id="composer-help">${esc(t("composerHelp"))}</p></div>
        <div><div class="composer-entry-row"><div class="job-input-wrap">${icon("link")}<label class="sr-only" for="job-input">${esc(t("inputLabel"))}</label><textarea id="job-input" rows="1" maxlength="12000" placeholder="${esc(t("inputPlaceholder"))}" aria-describedby="composer-help import-error" aria-invalid="${Boolean(f.error)}">${esc(f.input)}</textarea></div><button class="action primary" id="import-continue" ${!f.input.trim() || f.busy ? "disabled" : ""} aria-busy="${f.busy}">${esc(t(f.busy ? "preparing" : "continue"))}${icon("arrow")}</button></div>
        <p id="import-error" class="inline-error" role="alert" ${f.error ? "" : "hidden"}>${esc(f.error ? t(f.error) : "")}</p>
        <div class="composer-entry-footer"><button class="quiet-link" data-example>${esc(t("example"))}</button></div></div></div>`;
    } else if (f.stage === "choice") {
      body = `<div class="flow-choice-layout"><div>${flowJob(job)}${!job.fixture ? `<p class="flow-subtitle">${esc(t("importNotice"))}</p>` : ""}<a class="quiet-link" href="#/job/${encodeURIComponent(job.id)}" data-job-link="${esc(job.id)}">${esc(t("viewJob"))}${icon("arrow")}</a></div>
        <div><p class="flow-subtitle">${esc(t("choose"))}</p><div class="choice-grid">${["resume", "letter"].map((type) => `<button class="document-choice" data-document="${type}">${icon(type === "resume" ? "file" : "letter")}<strong>${esc(t(type))}</strong><span>${esc(t(`${type}Help`))}</span>${icon("arrow").replace('class="icon"', 'class="icon choice-arrow"')}</button>`).join("")}</div></div></div>`;
    } else if (f.stage === "letter") {
      body = `<div class="letter-layout">${flowJob(job)}<h2>${esc(t("letterTitle"))}</h2><p class="flow-subtitle" id="personal-help">${esc(t("letterHelpLong"))}</p><label class="sr-only" for="personal-context">${esc(t("letterTitle"))}</label><textarea id="personal-context" maxlength="3000" placeholder="${esc(t("letterPlaceholder"))}" aria-describedby="personal-help personal-count">${esc(f.personal)}</textarea><div class="field-meta"><span id="personal-remaining"></span><span id="personal-count"></span></div><button class="action primary wide" id="generate-letter">${esc(t("createLetter"))}${icon("arrow")}</button></div>`;
    } else if (f.stage === "loading") {
      body = `<div class="flow-loading" role="status" aria-live="polite"><div class="loading-orbit">${icon("file")}</div><h2>${esc(t(f.loadingType === "letter" ? "loadingLetter" : "loadingResume"))}</h2><p class="flow-subtitle">${esc(t("loadingHelp"))}</p></div>`;
    } else if (f.stage === "preview" && f.document) {
      body = `<div class="preview-scroll"><article id="document-preview" class="document-paper" tabindex="0" aria-label="${esc(t("reviewing"))}">${documentMarkup(f.document.text)}</article></div>
        <div class="preview-toolbar"><div><button class="action" id="edit-document" aria-pressed="false">${icon("edit")}<span>${esc(t("edit"))}</span></button><button class="action" id="copy-document">${icon("copy")}${esc(t("copy"))}</button><button class="action" id="download-document">${icon("download")}${esc(t("download"))}</button></div><button class="action primary" id="save-document">${esc(t("saveDocument"))}${icon("check")}</button></div><p class="preview-notice">${esc(t("docNotice"))}</p>`;
    }
    mount.innerHTML = `<section class="composer${f.stage === "input" ? " composer-entry" : ""}" aria-label="${esc(t("composerTitle"))}">${f.stage !== "input" ? `<div class="flow-top"><button class="quiet-link" data-back-flow>${icon("chevron-left")}${esc(t("back"))}</button>${route.kind !== "detail" ? `<button class="quiet-link" data-new-job>${esc(t("newJob"))}${icon("plus")}</button>` : ""}</div>` : ""}${body}</section>`;
    if (f.stage === "input") resizeJobInput();
    if (f.stage === "letter") updatePersonalCounter();
    hydrateImages();
    if (focus) $(focus)?.focus({ preventScroll: true });
  }
  function classifyInput(raw) {
    const text = raw.trim();
    const looksLikeURL =
      /^(?:[a-z][a-z\d+.-]*:\/\/|www\.)/i.test(text) || /^[^\s]+\.[a-z]{2,}(?:\/|$)/i.test(text);
    if (!looksLikeURL) return { kind: "description", valid: text.length >= 50 };
    const url = safeURL(/^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return {
      kind: "link",
      valid: Boolean(
        url &&
          new URL(url).hostname.includes(".") &&
          !/\s/.test(text) &&
          !new URL(url).username &&
          !new URL(url).password,
      ),
      url,
    };
  }
  async function importJob() {
    if (state.flow.busy) return;
    const input = state.flow.input.trim();
    const info = classifyInput(input);
    if (!info.valid) {
      state.flow.error = info.kind === "link" ? "invalidLink" : "invalidDescription";
      renderComposer("#job-input");
      return;
    }
    const token = ++operation;
    state.flow.error = "";
    state.flow.busy = true;
    renderComposer();
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (token !== operation) return;
    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    let job = state.imported.find((j) => j.importText === input);
    if (!job) {
      const title =
        info.kind === "link"
          ? state.locale === "pt"
            ? "Vaga adicionada por link"
            : "Job added from a link"
          : lines[0].slice(0, 160);
      const company =
        lines
          .find((line) => /^(empresa|company)\s*:/i.test(line))
          ?.replace(/^(empresa|company)\s*:\s*/i, "") ||
        (state.locale === "pt" ? "Empresa a confirmar" : "Company to confirm");
      const location =
        lines
          .find((line) => /^(local|localização|location)\s*:/i.test(line))
          ?.replace(/^(local|localização|location)\s*:\s*/i, "") || "";
      const text = normalize(input);
      job = {
        id: `external-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        company,
        companyDomain: null,
        initials: company.slice(0, 2),
        description: info.kind === "link" ? t("importNotice") : input,
        importText: input,
        sourceURL: info.kind === "link" ? info.url : null,
        location,
        workMode:
          info.kind === "link"
            ? null
            : /hibrid|hybrid/.test(text)
              ? "hybrid"
              : /remot/.test(text)
                ? "remote"
                : /presencial|on-site/.test(text)
                  ? "onsite"
                  : null,
        contract: "",
        tags: [],
        masterMatchScore: null,
        daysAgo: 0,
        fixture: false,
      };
      state.imported.push(job);
    }
    state.flow.jobId = job.id;
    state.flow.stage = "choice";
    state.flow.busy = false;
    state.flow.document = null;
    persist();
    renderComposer('[data-document="resume"]');
    $("#announcement").textContent = t("choose");
  }
  function updatePersonalCounter() {
    const count = Array.from(state.flow.personal.trim()).length;
    const left = Math.max(0, 200 - count);
    $("#personal-count").textContent = `${count} / 200 mín.`;
    $("#personal-remaining").textContent = left ? `${left} ${t("remaining")}` : t("readyLetter");
    $("#generate-letter").disabled = left > 0;
  }
  function buildDocument(job, type, personal) {
    const name = state.userName;
    if (type === "letter")
      return state.locale === "pt"
        ? `${name}\nCarta de apresentação\n${job.title} · ${job.company}\n\nOlá, equipe da ${job.company},\n\nTenho interesse na oportunidade de ${job.title} e gostaria de compartilhar o que me aproxima desse próximo passo.\n\n${personal}\n\nMinha experiência em desenvolvimento de software me ensinou a conectar decisões técnicas às necessidades das pessoas. Gostaria de conversar sobre como essa trajetória pode contribuir para os desafios da equipe.\n\nAgradeço pela atenção e pela oportunidade de apresentar minha história.\n\nAtenciosamente,\n${name}`
        : `${name}\nCover letter\n${job.title} · ${job.company}\n\nDear ${job.company} team,\n\nI am interested in the ${job.title} opportunity and would like to share what connects my experience to this next step.\n\n${personal}\n\nMy software development experience has taught me to connect technical decisions with people's needs. I would welcome a conversation about how I could contribute to your team.\n\nThank you for your time and consideration.\n\nSincerely,\n${name}`;
    return state.locale === "pt"
      ? `${name}\nEngenheiro de Software\nSão Paulo, Brasil · enzo@example.com\n\nOBJETIVO\n${job.title} · ${job.company}\n\nPERFIL PROFISSIONAL\nEngenheiro de software com experiência em interfaces React e TypeScript, APIs e colaboração com equipes de produto. Interesse em construir experiências acessíveis, confiáveis e alinhadas às necessidades das pessoas.\n\nEXPERIÊNCIA\nEngenheiro de Software · Empresa de exemplo\n2022 — Atual\n• Desenvolvimento de interfaces com React e TypeScript em parceria com design e produto.\n• Construção de APIs e integrações com Node.js e PostgreSQL.\n• Criação de componentes reutilizáveis, testes e documentação técnica.\n\nCOMPETÊNCIAS\nReact · TypeScript · Node.js · PostgreSQL · APIs · Acessibilidade · Testes\n\nFORMAÇÃO\nBacharelado em Ciência da Computação\nInstituição de exemplo · 2018 — 2021`
      : `${name}\nSoftware Engineer\nSão Paulo, Brazil · enzo@example.com\n\nTARGET ROLE\n${job.title} · ${job.company}\n\nPROFILE\nSoftware engineer experienced in React and TypeScript interfaces, APIs and collaboration with product teams. Interested in building accessible, reliable experiences grounded in people's needs.\n\nEXPERIENCE\nSoftware Engineer · Example company\n2022 — Present\n• Developed React and TypeScript interfaces with design and product teams.\n• Built APIs and integrations using Node.js and PostgreSQL.\n• Created reusable components, tests and technical documentation.\n\nSKILLS\nReact · TypeScript · Node.js · PostgreSQL · APIs · Accessibility · Testing\n\nEDUCATION\nBachelor of Computer Science\nExample institution · 2018 — 2021`;
  }
  async function generate(type) {
    const f = state.flow,
      job = jobById(f.jobId);
    if (
      !job ||
      f.stage === "loading" ||
      (type === "letter" && Array.from(f.personal.trim()).length < 200)
    )
      return;
    const token = ++operation;
    f.stage = "loading";
    f.loadingType = type;
    renderComposer();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (token !== operation) return;
    f.document = {
      id: `doc-${Date.now()}`,
      jobId: job.id,
      type,
      text: buildDocument(job, type, f.personal.trim()),
    };
    f.stage = "preview";
    persist();
    renderComposer("#document-preview");
    $("#announcement").textContent = t("reviewing");
  }
  function openLetter() {
    state.flow.stage = "letter";
    persist();
    renderComposer("#personal-context");
  }
  function backFlow() {
    operation++;
    state.flow.busy = false;
    if (state.flow.stage === "choice") {
      if (route.kind === "detail") {
        state.flow.stage = "input";
        renderComposer();
        $("[data-prepare]")?.focus();
        return;
      }
      state.flow.stage = "input";
    } else state.flow.stage = "choice";
    persist();
    renderComposer(state.flow.stage === "input" ? "#job-input" : '[data-document="resume"]');
  }
  function saveDocument() {
    const doc = state.flow.document;
    if (!doc) return;
    let application = applicationFor(doc.jobId);
    if (!application) {
      application = { jobId: doc.jobId, status: "draft", documents: [] };
      state.applications.push(application);
    }
    const index = application.documents.findIndex((d) => d.id === doc.id);
    if (index >= 0) application.documents[index] = { ...doc };
    else application.documents.push({ ...doc });
    if (application.status === "draft") application.status = "ready";
    persist();
    $$('[data-count="applications"]').forEach((el) => {
      el.textContent = state.applications.length;
    });
    if (route.kind === "detail") renderDetailPanel(jobById(route.id));
    toast(t("docSaved"));
  }
  async function copyDocument() {
    const text = state.flow.document?.text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast(t("copyDone"));
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;opacity:0;left:-9999px";
      document.body.append(area);
      area.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        /* The preview remains selectable. */
      }
      area.remove();
      if (!copied) {
        const range = document.createRange();
        range.selectNodeContents($("#document-preview"));
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      toast(t(copied ? "copyDone" : "copyFailed"));
    }
  }
  function downloadDocument() {
    const doc = state.flow.document;
    if (!doc) return;
    const url = URL.createObjectURL(new Blob([doc.text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.type}-${normalize(jobById(doc.jobId)?.company).replace(/[^a-z0-9]+/g, "-")}.txt`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function heading(tab) {
    const description =
      tab === "applications" ? "applicationHelp" : tab === "saved" ? "savedHelp" : "tagline";
    return `<div class="page-heading"><div><h1>${esc(t(tab))}</h1><p>${esc(t(description))}</p></div>${tab === "jobs" ? `<span class="page-note">${icon("file")}${esc(t("master"))}</span>` : ""}</div>`;
  }
  function tabs(tab) {
    return `<div class="view-tabs" role="tablist" aria-label="${esc(t("home"))}">${["jobs", "applications", "saved"].map((key) => `<button class="view-tab" id="tab-${key}" role="tab" data-tab="${key}" aria-selected="${tab === key}" aria-controls="tab-panel" tabindex="${tab === key ? "0" : "-1"}">${esc(t(key))}${key !== "jobs" ? `<span class="tab-count" data-count="${key}">${key === "saved" ? state.saved.length : state.applications.length}</span>` : ""}</button>`).join("")}</div>`;
  }
  function savedMarkup() {
    const jobs = state.saved.map(jobById).filter(Boolean);
    return jobs.length
      ? `<div class="job-grid">${jobs.map((j) => card(j)).join("")}</div>`
      : emptyMarkup(
          "noSaved",
          "noSavedHelp",
          `<a class="quiet-link" href="${jobsHref()}">${esc(t("explore"))}${icon("arrow")}</a>`,
        );
  }
  function applicationsMarkup() {
    return `<div class="kanban">${STATUSES.map((status) => {
      const applications = state.applications.filter((a) => a.status === status);
      return `<section class="kanban-column" aria-labelledby="status-${status}"><h2 id="status-${status}">${esc(t(status))}<span>${applications.length}</span></h2>${
        applications.length
          ? applications
              .map((a) => {
                const job = jobById(a.jobId);
                return job ? card(job, a) : "";
              })
              .join("")
          : `<p class="kanban-empty">${esc(t("noApplications"))}</p>`
      }</section>`;
    }).join("")}</div>`;
  }
  function renderDetailPanel(job) {
    const panel = $("#detail-panel");
    if (!panel) return;
    const saved = state.saved.includes(job.id),
      application = applicationFor(job.id);
    const url = safeURL(job.sourceURL);
    panel.innerHTML = `<div class="detail-score">${scoreMarkup(job.masterMatchScore)}<span>${esc(t("masterLabel"))}</span></div>
      <h2>${esc(t("prepare"))}</h2><button class="action primary wide" data-prepare="resume">${icon("file")}${esc(t("resume"))}</button>
      <button class="action wide" data-prepare="letter">${icon("letter")}${esc(t("letter"))}</button><button class="action wide" data-save="${esc(job.id)}" aria-pressed="${saved}">${icon("bookmark")}${esc(t(saved ? "unsave" : "save"))}</button>
      ${url ? `<a class="quiet-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t("original"))}${icon("external")}</a>` : ""}
      ${application ? `<div class="detail-status"><label for="detail-status-select">${esc(t("yourApplication"))}</label>${statusSelect(job.id, application.status).replace("<select ", '<select id="detail-status-select" ')}</div>` : ""}
      ${application?.documents.length ? `<div class="saved-documents"><h3>${esc(t("documents"))}</h3>${application.documents.map((doc) => `<button class="document-row" data-open-document="${esc(doc.id)}">${icon(doc.type === "resume" ? "file" : "letter")}${esc(t(doc.type))}</button>`).join("")}</div>` : ""}`;
  }
  function detailMarkup(job) {
    const returnTo =
      detailReturn && /^#\/jobs(?:[/?]|$)/.test(detailReturn) ? detailReturn : jobsHref();
    return `<a class="back-link" href="${esc(returnTo)}" data-detail-back>${icon("chevron-left")}${esc(t("backJobs"))}</a>
      <div class="detail-layout"><div><div class="detail-company">${logoMarkup(job, true)}<div><strong>${esc(job.company)}</strong><p>${esc(job.location || "—")}</p></div></div>
      <h1 class="detail-title">${esc(job.title)}</h1><div class="detail-meta"><span>${esc(t(job.workMode || "unknownMode"))}</span><span>${esc(job.contract || "")}</span></div>
      <article class="detail-copy"><h2>${esc(t("about"))}</h2>${job.description
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
        .join("")}
      ${["responsibilities", "requirements"].map((key) => (Array.isArray(job[key]) && job[key].length ? `<h2>${esc(t(key))}</h2><ul>${job[key].map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "")).join("")}</article>
      <div id="composer-mount" class="detail-flow"></div></div><aside class="detail-sidebar" aria-label="${esc(t("prepare"))}"><div id="detail-panel" class="detail-panel"></div></aside></div>`;
  }
  function syncLocale() {
    document.documentElement.lang = state.locale === "pt" ? "pt-BR" : "en";
    document.documentElement.classList.toggle("dark", state.dark);
    $("[data-home-label]").textContent = t("home");
    $('[data-page="curriculos"] .label').textContent =
      state.locale === "pt" ? "Currículos" : "Resumes";
    $('[data-page="perfil"] .label').textContent = state.locale === "pt" ? "Eu" : "Me";
    $('[data-page="vagas"]').href = jobsHref();
    $("#demo-caption").textContent = t("footer");
    $("#language-value").textContent = state.locale === "pt" ? "Português" : "English";
    $("[data-language-label]").textContent = state.locale === "pt" ? "Idioma" : "Language";
    $(".search-label").textContent =
      state.locale === "pt"
        ? "Buscar vagas, empresas ou pessoas…"
        : "Search jobs, companies or people…";
    $("#search-title").textContent = t("searchTitle");
    $("#search-input").placeholder = t("search");
    $("#account-label").textContent = state.userName.split(" ")[0];
    $("#menu-name").textContent = state.userName;
    $("#name-input").value = state.userName;
    $$("[data-theme-label]").forEach((el) => {
      el.textContent = state.dark
        ? state.locale === "pt"
          ? "Escuro"
          : "Dark"
        : state.locale === "pt"
          ? "Claro"
          : "Light";
    });
    $$("[data-theme-icon]").forEach((el) => {
      el.setAttribute("href", state.dark ? "#i-moon" : "#i-sun");
    });
  }
  function renderRoute() {
    const moveFocus = Boolean(lastRouteKey);
    operation++;
    state.flow.busy = false;
    if (state.flow.stage === "loading") state.flow.stage = "choice";
    imageObserver?.disconnect();
    scrollObserver?.disconnect();
    closePopovers();
    route = parseRoute();
    if (route.kind === "group" && !GROUPS.includes(route.group)) {
      history.replaceState(null, "", jobsHref());
      route = parseRoute();
    }
    if (route.kind === "detail" && jobById(route.id) && route.key !== lastRouteKey)
      rememberVisit(route.id);
    lastRouteKey = route.key;
    if (route.kind === "detail") {
      const job = jobById(route.id);
      if (history.state?.jobsReturn) detailReturn = history.state.jobsReturn;
      else if (detailReturn)
        history.replaceState({ ...history.state, jobsReturn: detailReturn }, "", location.href);
      $("#app").innerHTML = job
        ? detailMarkup(job)
        : emptyMarkup(
            "notFound",
            "notFoundHelp",
            `<a class="quiet-link" href="${jobsHref()}">${esc(t("backJobs"))}${icon("arrow")}</a>`,
          );
      if (job) {
        renderDetailPanel(job);
        renderComposer();
      }
      document.title = `${job?.title || t("notFound")} · Patch Careers`;
    } else {
      const tab = route.kind === "group" ? "jobs" : route.tab;
      $("#app").innerHTML =
        `${heading(tab)}${tabs(tab)}<div id="tab-panel" role="tabpanel" aria-labelledby="tab-${tab}">${tab === "jobs" ? `${route.kind === "group" ? `<a class="back-link" href="${jobsHref()}">${icon("chevron-left")}${esc(t("backGroup"))}</a>` : '<div id="composer-mount"></div>'}${filtersMarkup()}<div id="discovery-results"></div>` : tab === "saved" ? savedMarkup() : applicationsMarkup()}</div>`;
      if (tab === "jobs") {
        renderComposer();
        renderDiscovery();
      }
      document.title = `${t("home")} · Patch Careers`;
    }
    syncLocale();
    hydrateImages();
    persist();
    const position = positions.get(route.key);
    requestAnimationFrame(() => {
      if (position)
        $$(".shelf-grid").forEach((el) => {
          el.scrollLeft = position.shelves[el.dataset.group] || 0;
        });
      if (moveFocus) {
        const heading = $("#app h1") || $("#content");
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      window.scrollTo({ top: position?.y || 0, behavior: "instant" });
    });
  }

  function toggleSaved(id, source) {
    if (!jobById(id)) return;
    const index = state.saved.indexOf(id);
    if (index >= 0) state.saved.splice(index, 1);
    else state.saved.unshift(id);
    persist();
    const group = source?.closest("[data-shelf]")?.dataset.shelf;
    const scrolls = Object.fromEntries(
      $$(".shelf-grid").map((el) => [el.dataset.group, el.scrollLeft]),
    );
    if (route.kind === "detail") renderDetailPanel(jobById(id));
    else if (route.kind === "group" || route.tab === "jobs") {
      renderDiscovery();
      $$(".shelf-grid").forEach((el) => {
        el.scrollLeft = scrolls[el.dataset.group] || 0;
        updateCarousel(el);
      });
    } else if (route.tab === "saved") {
      $("#tab-panel").innerHTML = savedMarkup();
      hydrateImages();
    } else {
      $("#tab-panel").innerHTML = applicationsMarkup();
      hydrateImages();
    }
    $$('[data-count="saved"]').forEach((el) => {
      el.textContent = state.saved.length;
    });
    const scope = group ? $(`[data-shelf="${group}"]`) : document;
    const replacement = scope && $(`[data-save="${CSS.escape(id)}"]`, scope);
    if (replacement) replacement.focus({ preventScroll: true });
    else {
      const heading = group ? $(`#heading-${group}`) : $("#tab-saved");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
    toast(t(index >= 0 ? "unsavedToast" : "savedToast"));
  }
  function changeStatus(id, status) {
    const application = applicationFor(id);
    if (!application || !STATUSES.includes(status)) return;
    application.status = status;
    persist();
    if (route.kind === "home" && route.tab === "applications") {
      $("#tab-panel").innerHTML = applicationsMarkup();
      hydrateImages();
      $(`[data-status-job="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    }
    toast(t("statusSaved"));
  }
  function renderSearch() {
    const query = normalize($("#search-input").value.trim());
    const jobs = allJobs().filter((j) =>
      normalize([j.title, j.company, ...(j.tags || [])].join(" ")).includes(query),
    );
    $("#search-results").innerHTML = jobs.length
      ? jobs
          .map(
            (job) =>
              `<button class="search-result" data-search-job="${esc(job.id)}">${logoMarkup(job)}<span><strong>${esc(job.title)}</strong><small>${esc(job.company)}</small></span></button>`,
          )
          .join("")
      : `<p class="section-empty">${esc(t("noSearch"))}</p>`;
    hydrateImages();
  }
  function closePopovers(returnFocus = false) {
    const trigger = $('[aria-expanded="true"][aria-controls]');
    $$(".popover").forEach((el) => {
      el.hidden = true;
    });
    $$("[aria-expanded]").forEach((el) => {
      el.setAttribute("aria-expanded", "false");
    });
    if (returnFocus) trigger?.focus();
  }
  function togglePopover(trigger, id) {
    const panel = document.getElementById(id);
    if (!panel) return;
    const show = panel.hidden;
    closePopovers();
    if (show) {
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
  }
  function openDialog(id) {
    closePopovers();
    const dialog = document.getElementById(id);
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    if (id === "search-dialog") {
      $("#search-input").value = "";
      renderSearch();
      $("#search-input").focus();
    }
  }
  function moveCarousel(grid, direction) {
    const item = $(".opportunity", grid);
    if (!item) return;
    const step =
      (item.getBoundingClientRect().width + parseFloat(getComputedStyle(grid).columnGap)) * 4;
    grid.scrollBy({
      left: step * direction,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".popover") && !event.target.closest("[aria-controls]"))
      closePopovers();
    const button = event.target.closest("button,a");
    if (!button || button.disabled) return;
    if (button.matches(".skip-link")) {
      event.preventDefault();
      $("#content").focus();
      return;
    }
    if (button.matches('a[href^="#/"]')) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (button.dataset.jobLink && route.kind !== "detail") detailReturn = location.hash;
      navigate(button.closest(".brand-group") ? jobsHref() : button.getAttribute("href"));
      return;
    }
    const d = button.dataset;
    if (d.tab)
      navigate(
        d.tab === "jobs" ? jobsHref() : `#/jobs/${d.tab === "saved" ? "salvas" : "candidaturas"}`,
      );
    if (d.slide) moveCarousel($(`.shelf-grid[data-group="${d.group}"]`), Number(d.slide));
    if (d.save) toggleSaved(d.save, button);
    if (button.hasAttribute("data-open-filters")) renderFiltersDialog();
    if (button.hasAttribute("data-clear-filters")) {
      state.filters = emptyFilters();
      applyFilters();
      $("[data-open-filters]")?.focus();
    }
    if (d.removeFilter) {
      state.filters[d.removeFilter] = "";
      applyFilters();
      $("[data-open-filters]")?.focus();
    }
    if (button.hasAttribute("data-clear-filter-draft"))
      $$("#filters-form input, #filters-form select").forEach((el) => {
        el.value = "";
      });
    if (button.id === "import-continue") importJob();
    if (button.hasAttribute("data-example")) {
      state.flow.input =
        state.locale === "pt"
          ? "Desenvolvedor Front-end\nEmpresa: Acme\nLocalização: São Paulo\n\nBuscamos uma pessoa com experiência em React e TypeScript para construir interfaces acessíveis e rápidas. Você vai colaborar com design e produto, criar componentes reutilizáveis e contribuir com testes automatizados. Trabalho remoto."
          : "Frontend Engineer\nCompany: Acme\nLocation: São Paulo\n\nWe are looking for someone with React and TypeScript experience to build accessible, fast interfaces. You will collaborate with design and product, create reusable components and contribute automated tests. Remote work.";
      state.flow.error = "";
      persist();
      renderComposer("#job-input");
    }
    if (d.document) d.document === "letter" ? openLetter() : generate("resume");
    if (d.prepare && route.kind === "detail") {
      operation++;
      const personal = state.flow.jobId === route.id ? state.flow.personal : "";
      state.flow = { ...freshFlow(), jobId: route.id, stage: "choice", personal };
      if (d.prepare === "letter") openLetter();
      else generate("resume");
      $("#composer-mount")?.scrollIntoView({ block: "start", behavior: "instant" });
    }
    if (button.id === "generate-letter") generate("letter");
    if (button.hasAttribute("data-back-flow")) backFlow();
    if (button.hasAttribute("data-new-job")) {
      operation++;
      state.flow = freshFlow();
      persist();
      renderComposer("#job-input");
    }
    if (button.id === "save-document") saveDocument();
    if (button.id === "copy-document") copyDocument();
    if (button.id === "download-document") downloadDocument();
    if (button.id === "edit-document") {
      const editing = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(editing));
      $("span", button).textContent = t(editing ? "finish" : "edit");
      $("#document-preview").setAttribute("contenteditable", editing ? "plaintext-only" : "false");
      if (editing) $("#document-preview").focus();
      persist();
    }
    if (d.openDocument) {
      const doc = applicationFor(route.id)?.documents.find((x) => x.id === d.openDocument);
      if (doc) {
        operation++;
        state.flow = { ...freshFlow(), jobId: route.id, stage: "preview", document: { ...doc } };
        persist();
        renderComposer("#document-preview");
        $("#composer-mount").scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
    if (d.searchJob) {
      $("#search-dialog").close();
      detailReturn = route.kind === "detail" ? detailReturn : location.hash;
      navigate(`#/job/${encodeURIComponent(d.searchJob)}`);
    }
    if (d.popover) togglePopover(button, d.popover);
    if (button.id === "account-trigger") togglePopover(button, "account-panel");
    if (d.open) openDialog(d.open);
    if (button.hasAttribute("data-close")) button.closest("dialog")?.close();
    if (button.hasAttribute("data-theme-toggle")) {
      state.dark = !state.dark;
      syncLocale();
      persist();
    }
    if (button.hasAttribute("data-language-toggle")) {
      state.locale = state.locale === "pt" ? "en" : "pt";
      persist();
      renderRoute();
    }
    if (button.hasAttribute("data-message")) openDialog("message-dialog");
    if (button.id === "sign-out") openDialog("auth-dialog");
    if (button.id === "demo-login") $("#auth-dialog").close();
  });
  document.addEventListener("input", (event) => {
    const el = event.target;
    if (el.id === "job-input") {
      operation++;
      state.flow.input = el.value;
      state.flow.error = "";
      state.flow.busy = false;
      el.setAttribute("aria-invalid", "false");
      $("#import-error").hidden = true;
      $("#import-continue").disabled = !el.value.trim();
      $("#import-continue").setAttribute("aria-busy", "false");
      $("#import-continue").innerHTML = `${esc(t("continue"))}${icon("arrow")}`;
      resizeJobInput();
      queuePersist();
    }
    if (el.id === "personal-context") {
      state.flow.personal = el.value;
      updatePersonalCounter();
      queuePersist();
    }
    if (el.id === "document-preview" && state.flow.document) {
      state.flow.document.text = el.innerText;
      queuePersist();
    }
    if (el.id === "search-input") renderSearch();
  });
  document.addEventListener("change", (event) => {
    const el = event.target;
    if (el.dataset.statusJob) changeStatus(el.dataset.statusJob, el.value);
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "filters-form") {
      event.preventDefault();
      const data = new FormData(event.target);
      for (const key of Object.keys(state.filters))
        state.filters[key] = String(data.get(key) || "")
          .trim()
          .slice(0, 200);
      $("#filters-dialog").close();
      applyFilters();
    }
    if (event.target.id === "settings-form") {
      event.preventDefault();
      const name = $("#name-input").value.trim();
      if (name) {
        state.userName = name.slice(0, 80);
        persist();
        syncLocale();
        $("#settings-dialog").close();
      }
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (!$("dialog[open]")) openDialog("search-dialog");
    }
    if (event.key === "Escape" && !$("dialog[open]")) closePopovers(true);
    if (
      event.target.matches("[data-tab]") &&
      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    ) {
      event.preventDefault();
      const options = ["jobs", "applications", "saved"];
      const index = options.indexOf(event.target.dataset.tab);
      const next =
        options[
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? 2
              : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3
        ];
      navigate(
        next === "jobs" ? jobsHref() : `#/jobs/${next === "saved" ? "salvas" : "candidaturas"}`,
      );
      requestAnimationFrame(() =>
        requestAnimationFrame(() => $(`[data-tab="${next}"]`)?.focus({ preventScroll: true })),
      );
    }
    if (
      event.target.matches(".shelf-grid") &&
      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    ) {
      event.preventDefault();
      const grid = event.target;
      if (event.key === "Home" || event.key === "End")
        grid.scrollTo({ left: event.key === "Home" ? 0 : grid.scrollWidth, behavior: "instant" });
      else moveCarousel(grid, event.key === "ArrowRight" ? 1 : -1);
    }
    if (event.key === "ArrowDown" && event.target.matches("[aria-expanded][aria-controls]")) {
      event.preventDefault();
      const trigger = event.target,
        id = trigger.getAttribute("aria-controls");
      if (document.getElementById(id)?.hidden) togglePopover(trigger, id);
      $("button,a", document.getElementById(id))?.focus();
    }
  });
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    });
  });
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("pagehide", persist);
  window.addEventListener("resize", resizeJobInput);
  window.addEventListener(
    "scroll",
    () => {
      if (route) rememberPosition();
    },
    { passive: true },
  );
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash || location.hash === "#content") history.replaceState(null, "", jobsHref());
  renderRoute();

  const nav = document.querySelector(".nav-links");
  const items = [...nav.querySelectorAll(".nav-link")];
  const markerPath = nav.querySelector(".marker path");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion:reduce)");
  const motion = {
    duration: 1150,
    initialDuration: 1000,
    retractEnd: 0.16,
    drawStart: 0.22,
    easing: "cubic-bezier(.45,0,.25,1)",
    itemDuration: 420,
    itemExitDuration: 240,
    itemEasing: "cubic-bezier(.25,.1,.25,1)",
  };
  let selectedIndex = -1;
  let selectionAnimations = [];
  function cancelSelectionAnimations() {
    selectionAnimations.forEach((animation) => {
      animation.cancel();
    });
    selectionAnimations = [];
  }
  function selectNavigation(key) {
    const index = items.findIndex((item) => item.dataset.page === key);
    if (index < 0) return;
    if (index !== selectedIndex) {
      const initial = selectedIndex < 0;
      const direction = index < selectedIndex ? "left" : "right";
      const drawOffset = direction === "left" ? -1 : 1;
      const style = getComputedStyle(markerPath);
      const current = { strokeDashoffset: style.strokeDashoffset, opacity: style.opacity };
      const selection = items.map((item) =>
        initial ? 0 : Number(getComputedStyle(item).getPropertyValue("--selection")),
      );
      cancelSelectionAnimations();
      items.forEach((item, i) => {
        if (i === index) {
          item.dataset.direction = direction;
          item.setAttribute("aria-current", "page");
        } else {
          // A full selection clears in the same direction as the navigation.
          if (selection[i] === 1) item.dataset.direction = direction === "left" ? "right" : "left";
          item.removeAttribute("aria-current");
        }
      });
      nav.style.setProperty("--index", index);
      if (!reducedMotion.matches) {
        const timing = {
          duration: initial ? motion.initialDuration : motion.duration,
          easing: initial ? motion.easing : "linear",
        };
        const startTime = document.timeline.currentTime;
        const animate = (element, frames, options = timing) => {
          const animation = element.animate(frames, options);
          if (startTime !== null) animation.startTime = startTime;
          selectionAnimations.push(animation);
        };
        // Selection responds immediately; the underline keeps its longer drawing motion.
        const frames = initial
          ? [
              { strokeDashoffset: drawOffset, opacity: 0 },
              { strokeDashoffset: 0, opacity: 1 },
            ]
          : [
              { ...current, offset: 0, easing: "ease-in-out" },
              { strokeDashoffset: drawOffset, opacity: 0, offset: motion.retractEnd },
              {
                strokeDashoffset: drawOffset,
                opacity: 0,
                offset: motion.drawStart,
                easing: motion.easing,
              },
              { strokeDashoffset: 0, opacity: 1, offset: 1 },
            ];
        animate(markerPath, frames);
        items.forEach((item, i) => {
          const from = selection[i];
          const to = i === index ? 1 : 0;
          if (from === to) return;
          animate(item, [{ "--selection": from }, { "--selection": to }], {
            duration: to === 1 ? motion.itemDuration : motion.itemExitDuration,
            easing: motion.itemEasing,
          });
        });
      }
      selectedIndex = index;
    }
  }
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) cancelSelectionAnimations();
  });

  selectNavigation("vagas");
})();
