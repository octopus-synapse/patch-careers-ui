/**
 * Jobs feature copy (tab de Vagas: lista, filtros, salvos, detalhe).
 * Both locales live side by side so key parity is reviewed in one place;
 * the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const jobsPtBR: TranslationDict = {
  title: "Vagas",
  loading: "Carregando vagas",
  scope: {
    all: "Todas",
    saved: "Salvas",
    applications: "Candidaturas",
  },
  count: {
    updatedDaily: "Atualizadas diariamente",
    jobs: {
      one: "{count} vaga",
      many: "{count} vagas",
    },
    results: {
      one: "{count} resultado",
      many: "{count} resultados",
    },
    saved: {
      one: "{count} vaga salva",
      many: "{count} vagas salvas",
    },
    applications: {
      one: "{count} candidatura",
      many: "{count} candidaturas",
    },
  },
  sections: {
    today: "Hoje",
    week: "Esta semana",
    earlier: "Anteriores",
  },
  recency: {
    today: "hoje",
    yesterday: "ontem",
    daysAgo: "há {days} dias",
  },
  row: {
    a11y: "Vaga {title} na {company}",
    viaPublisher: "via {publisher}",
  },
  save: {
    add: "Salvar vaga",
    remove: "Remover dos salvos",
  },
  filters: {
    button: "Filtrar",
    buttonA11y: "Filtrar vagas",
    title: "Filtrar vagas",
    close: "Fechar filtros",
    apply: "Aplicar",
    clearAll: "Limpar tudo",
    clearAllA11y: "Limpar todos os filtros",
    removeChipA11y: "Remover filtro {label}",
    groups: {
      workMode: "Modalidade",
      employmentType: "Tipo de vaga",
      postedWithin: "Publicada em",
    },
  },
  // Candidaturas scope (folded in from the retired Candidaturas tab).
  applications: {
    appliedTag: "Candidatado",
    silence: "Sem resposta há {days} dias",
    status: {
      review: "Em análise",
      interview: "Entrevista",
      response: "Resposta",
      noResponse: "Sem retorno",
      closed: "Encerradas",
    },
  },
  // "Você se candidatou?" prompt shown on return from an external apply site.
  didApply: {
    title: "Você se candidatou?",
    description:
      "Concluiu a candidatura no site do anunciante? Usamos isso para acompanhar suas candidaturas.",
    yes: "Sim, me candidatei",
    no: "Ainda não",
    dismiss: "Agora não",
  },
  // Apply flow: choose master × tailored → AI progress → review → ready.
  applyFlow: {
    title: "Candidatar-se",
    chooseTailor: "Personalizar pra esta vaga",
    chooseTailorBody:
      "Título, resumo e bullets reescritos pro escopo da vaga. Você revisa tudo antes.",
    chooseTailorMeta: "≈ 10s · sua compatibilidade sobe",
    chooseTailorLocked: "Melhore seu currículo (mín. 50 de qualidade) para personalizá-lo.",
    chooseTailorFitGate: "Responda o Fit Profile para desbloquear a personalização.",
    chooseMaster: "Usar o currículo master",
    chooseMasterBody: "Seu currículo como está, sem alterações.",
    chooseMasterMeta: "imediato · {score}% de compatibilidade",
    chooseMasterMetaNoScore: "imediato",
    chooseNote: "Nada é enviado sem a sua revisão.",
    tailoringTitle: "Personalizando pra {company}",
    tailoringStep1: "Lendo o escopo da vaga",
    tailoringStep2: "Ajustando o título pro alvo da vaga",
    tailoringStep3: "Reescrevendo o resumo",
    tailoringStep4: "Injetando as palavras-chave nos bullets",
    tailoringNote: "Nada inventado: só o que já está no seu perfil, reorganizado pra vaga.",
    tailorError: "Não foi possível personalizar agora. Tente novamente.",
    reviewTitle: "Revisar mudanças",
    reviewDelta: "{before}% → {after}% de compatibilidade",
    reviewDeltaNote: "Estimativa baseada nas palavras-chave injetadas.",
    changeTitle: "Título",
    changeSummary: "Resumo",
    changeBullet: "Bullet",
    changeKeywords: "Palavras-chave: {keywords}",
    reviewEmpty: "A IA não encontrou mudanças que melhorem seu currículo pra esta vaga.",
    reviewContinue: "Continuar",
    reviewUseMaster: "Usar o master mesmo assim",
    readyTitle: "Pronto pra candidatar",
    readyMasterName: "Currículo master",
    readySaved: "Salvo em Currículos",
    readyCompat: "{score}% de compatibilidade",
    download: "Baixar CV (PDF)",
    downloadError: "Não foi possível gerar o PDF agora.",
    step1: "Baixe o CV — o formulário da empresa vai pedir o arquivo.",
    step2: "Abra a vaga no site e anexe o arquivo lá.",
    openSite: "Abrir vaga no site",
  },
  postedWithin: {
    today: "Hoje",
    last3Days: "Últimos 3 dias",
    lastWeek: "Última semana",
    any: "Qualquer data",
  },
  empty: {
    error: {
      title: "Não foi possível carregar as vagas",
      description: "Verifique sua conexão e tente novamente.",
      cta: "Tentar novamente",
    },
    saved: {
      title: "Nenhuma vaga salva ainda",
      description: "Toque no marcador de uma vaga para guardá-la aqui.",
      cta: "Ver todas as vagas",
    },
    filtered: {
      title: "Nenhuma vaga encontrada",
      description: "Tente ajustar ou remover os filtros.",
      cta: "Limpar filtros",
    },
    none: {
      title: "Nenhuma vaga por aqui ainda",
      description: "Novas vagas chegam todos os dias às 6h. Volte em breve.",
    },
    applications: {
      title: "Nenhuma candidatura ainda",
      description: "Quando você se candidatar a uma vaga, ela aparece aqui.",
      cta: "Encontrar vagas para aplicar",
    },
  },
  detail: {
    back: "Voltar",
    notFound: {
      title: "Vaga não encontrada",
      description: "Esta vaga não está mais disponível ou ainda não foi carregada.",
      cta: "Ver vagas",
    },
    noDescription:
      "O anunciante não forneceu uma descrição. Os detalhes completos estão na página da vaga.",
    apply: "Candidatar-se",
    opensPublisherSite: "Abre a vaga no site do anunciante",
    opensPublisherSiteNamed: "Abre a vaga no site do anunciante ({publisher})",
  },
};

export const jobsEn: TranslationDict = {
  title: "Jobs",
  loading: "Loading jobs",
  scope: {
    all: "All",
    saved: "Saved",
    applications: "Applications",
  },
  count: {
    updatedDaily: "Updated daily",
    jobs: {
      one: "{count} job",
      many: "{count} jobs",
    },
    results: {
      one: "{count} result",
      many: "{count} results",
    },
    saved: {
      one: "{count} saved job",
      many: "{count} saved jobs",
    },
    applications: {
      one: "{count} application",
      many: "{count} applications",
    },
  },
  sections: {
    today: "Today",
    week: "This week",
    earlier: "Earlier",
  },
  recency: {
    today: "today",
    yesterday: "yesterday",
    daysAgo: "{days} days ago",
  },
  row: {
    a11y: "Job {title} at {company}",
    viaPublisher: "via {publisher}",
  },
  save: {
    add: "Save job",
    remove: "Remove from saved",
  },
  filters: {
    button: "Filter",
    buttonA11y: "Filter jobs",
    title: "Filter jobs",
    close: "Close filters",
    apply: "Apply",
    clearAll: "Clear all",
    clearAllA11y: "Clear all filters",
    removeChipA11y: "Remove filter {label}",
    groups: {
      workMode: "Work mode",
      employmentType: "Job type",
      postedWithin: "Posted",
    },
  },
  // Applications scope (folded in from the retired Applications tab).
  applications: {
    appliedTag: "Applied",
    silence: "No reply for {days} days",
    status: {
      review: "In review",
      interview: "Interview",
      response: "Response",
      noResponse: "No reply",
      closed: "Closed",
    },
  },
  // "Did you apply?" prompt shown on return from an external apply site.
  didApply: {
    title: "Did you apply?",
    description:
      "Did you finish applying on the publisher's site? We use this to track your applications.",
    yes: "Yes, I applied",
    no: "Not yet",
    dismiss: "Not now",
  },
  // Apply flow: choose master × tailored → AI progress → review → ready.
  applyFlow: {
    title: "Apply",
    chooseTailor: "Tailor for this job",
    chooseTailorBody:
      "Title, summary and bullets rewritten for the job's scope. You review everything first.",
    chooseTailorMeta: "≈ 10s · your compatibility goes up",
    chooseTailorLocked: "Improve your résumé (min. 50 quality) to tailor it.",
    chooseTailorFitGate: "Answer the Fit Profile to unlock tailoring.",
    chooseMaster: "Use the master résumé",
    chooseMasterBody: "Your résumé as it is, unchanged.",
    chooseMasterMeta: "instant · {score}% compatibility",
    chooseMasterMetaNoScore: "instant",
    chooseNote: "Nothing is sent without your review.",
    tailoringTitle: "Tailoring for {company}",
    tailoringStep1: "Reading the job's scope",
    tailoringStep2: "Adjusting the title to the job's target",
    tailoringStep3: "Rewriting the summary",
    tailoringStep4: "Injecting the keywords into your bullets",
    tailoringNote: "Nothing invented: only what's already in your profile, rearranged for the job.",
    tailorError: "Couldn't tailor right now. Try again.",
    reviewTitle: "Review changes",
    reviewDelta: "{before}% → {after}% compatibility",
    reviewDeltaNote: "Estimate based on the injected keywords.",
    changeTitle: "Title",
    changeSummary: "Summary",
    changeBullet: "Bullet",
    changeKeywords: "Keywords: {keywords}",
    reviewEmpty: "The AI found no changes that would improve your résumé for this job.",
    reviewContinue: "Continue",
    reviewUseMaster: "Use the master anyway",
    readyTitle: "Ready to apply",
    readyMasterName: "Master résumé",
    readySaved: "Saved in Résumés",
    readyCompat: "{score}% compatibility",
    download: "Download CV (PDF)",
    downloadError: "Couldn't generate the PDF right now.",
    step1: "Download the CV — the company's form will ask for the file.",
    step2: "Open the job on their site and attach the file there.",
    openSite: "Open job site",
  },
  postedWithin: {
    today: "Today",
    last3Days: "Last 3 days",
    lastWeek: "Last week",
    any: "Any date",
  },
  empty: {
    error: {
      title: "Couldn't load the jobs",
      description: "Check your connection and try again.",
      cta: "Try again",
    },
    saved: {
      title: "No saved jobs yet",
      description: "Tap a job's bookmark to keep it here.",
      cta: "See all jobs",
    },
    filtered: {
      title: "No jobs found",
      description: "Try adjusting or removing the filters.",
      cta: "Clear filters",
    },
    none: {
      title: "No jobs here yet",
      description: "New jobs arrive every day at 6 a.m. Check back soon.",
    },
    applications: {
      title: "No applications yet",
      description: "When you apply to a job, it shows up here.",
      cta: "Find jobs to apply to",
    },
  },
  detail: {
    back: "Back",
    notFound: {
      title: "Job not found",
      description: "This job is no longer available or hasn't been loaded yet.",
      cta: "See jobs",
    },
    noDescription:
      "The publisher didn't provide a description. The full details are on the job page.",
    apply: "Apply",
    opensPublisherSite: "Opens the job on the publisher's site",
    opensPublisherSiteNamed: "Opens the job on the publisher's site ({publisher})",
  },
};
