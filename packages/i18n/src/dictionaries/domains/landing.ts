/**
 * Landing page copy (a página pública em `/`, só na web).
 *
 * Both locales live side by side so key parity is reviewed in one place; the
 * parity spec in apps/client enforces it.
 *
 * Two conventions worth knowing before editing:
 *
 *  1. **Headings are split** into `headingLead` + `headingEm`. The landing
 *     renders the emphasised clause in the chapter's accent colour and italic
 *     serif, so it has to be its own text run — never ship markup through
 *     `t()`.
 *  2. **Numbers that animate are not copy.** The counters (7,4 · 244 · 68 …)
 *     live as constants in `features/landing/model/chapters.ts` and are
 *     formatted with `Intl.NumberFormat`, so "7,4" in pt-BR and "7.4" in en
 *     come for free. Only numbers baked into a sentence (or a source line)
 *     appear here as literal text.
 *
 * Never use arrays: `flattenKeys` in the static-analysis utils skips them, so
 * array copy would silently escape the parity spec.
 */

import type { TranslationDict } from "../../types";

export const landingPtBR: TranslationDict = {
  header: {
    signIn: "Entrar",
    signUp: "Criar conta",
  },

  // Títulos curtos do trilho lateral de capítulos.
  rail: {
    hero: "Você é bom",
    dor: "7,4 segundos",
    robo: "O robô",
    cena: "Não malvado",
    vivo: "Por vaga",
    vivo2: "A Camila",
    notas: "As notas",
    notas2: "Sete notas",
    auto: "Auto-apply",
    auto2: "Esta noite",
    clique: "A peça",
    cta: "Sua nota",
  },

  chapters: {
    hero: {
      headingLead: "Você é bom.",
      headingSecond: "Seu currículo",
      headingEm: "não está dizendo isso.",
      bodyLead: "Um currículo vivo: reescrito pra cada vaga em",
      bodyEm: "5 segundos",
      bodyTail: ", feito pra passar no robô e chegar numa pessoa.",
      inputPlaceholder: "Cole o link ou o texto da vaga…",
      cta: "Ver meu currículo pra essa vaga",
      reassurance: "Você vê o resultado antes de criar conta.",
    },
    dor: {
      statUnit: "s",
      heading: "É o tempo que um recrutador leva pra decidir sobre você.",
      bodyLead: "Cada vaga recebe",
      bodyApplications: "{count} candidaturas",
      bodyRatio: "6 em cada 10 brasileiros",
      bodyTail: "nunca recebem resposta.",
      sources:
        "Fontes: 7,4 s — Ladders, estudo de eye-tracking, 2018 · 244 — Greenhouse, 2025 · 3 — CareerPlug, 2025 · 6 em 10 — Indeed Brasil, 2025",
    },
    robo: {
      headingLead: "Antes de convencer o recrutador,",
      headingEm: "convença o robô.",
      body: 'Um software lê seu currículo antes de qualquer pessoa. Ele procura as palavras da vaga. Se você escreveu "atendimento ao cliente" e a vaga pedia "suporte", pra ele você não serve.',
      statTail:
        "das empresas brasileiras já triam currículos com IA. Nos EUA, 97,8% das 500 maiores usam um robô — e 88% delas admitem que ele descarta gente qualificada.",
      gupyLead: "Só na Gupy,",
      gupyMillions: "{count} milhões",
      gupyMid: "de candidaturas por mês passam pelo filtro antes de alguém ler. Menos de",
      gupyPercent: "1%",
      gupyTail: "vira contratação.",
      sources:
        "Fontes: 68% — Caju e Fundação Dom Cabral, 2026 · 97,8% — Jobscan, 2025 · 88% — Harvard Business School, Hidden Workers, 2021 · 15 milhões e 1% — Gupy, via O Tempo, 2024",
    },
    cena: {
      heading: "O robô é burro, não malvado.",
      robotSays: "ei, eu ouvi isso",
      translatingLabel: "traduzindo…",
      translationLabel: "tradução",
      translation: "ei, eu ouvi isso.",
      oops: "ops.",
    },
    vivo: {
      headingLead: "Cada vaga quer ver uma",
      headingEm: "versão diferente",
      headingTail: "de você.",
      bodyLead: "Você escreve",
      bodyEm: "um currículo",
      bodyTail:
        ". Pra cada vaga, o Patch destaca o que importa, esconde o que atrapalha e fala a língua daquela empresa — em 5 segundos.",
      statLead: "Currículo com o título exato da vaga recebe",
      statInterviews: "{count}× mais entrevistas",
      statMid: ". Adaptar à mão leva de",
      statMinutes: "30 a 90 minutos",
      statTail: "por vaga — por isso só",
      statShare: "25,7%",
      statEnd: "adaptam sempre.",
      sources:
        "Fontes: 10,6× — Jobscan, 2026 · 30–90 min — TailorForge, 2026 · 25,7% — Novoresume, 2026",
    },
    vivo2: {
      headingLead: "Toque numa vaga e veja",
      headingEm: "a Camila",
      headingTail: "mudar.",
    },
    notas: {
      headingLead: "Toda nota abre",
      headingEm: "o porquê.",
      body: "O feedback que nenhuma empresa te deu. Sete notas, cada uma com o que mede, por que deu isso e o que fazer pra subir. A cor diz quão perto você está.",
      typoLead: "Erro de português é o motivo nº 1 de descarte no Brasil:",
      typoShareBr: "30%",
      typoMid: "dos currículos caem por isso, mais que por falta de experiência. Nos EUA,",
      typoShareUs: "77%",
      typoTail:
        "dos empregadores descartam por um erro de digitação. A nota de Conteúdo te avisa antes.",
      sources:
        "Fontes: 30% — Catho, pesquisa com 400 recrutadores, 2019 · 77% — CareerBuilder, 2023",
    },
    notas2: {
      heading: "As sete notas da Camila.",
      legendPoor: "0–49",
      legendFair: "50–69",
      legendGood: "70–84",
      legendExcellent: "85–100",
    },
    auto: {
      eyebrow: "Auto-apply · só onde faz sentido",
      headingLead: "Aplique",
      headingEm: "enquanto você dorme.",
      line1: "Você precisa dormir. Ele não.",
      line2: "Fome, sono, desânimo, domingo à noite. Nada disso existe pra ele.",
      bodyLead:
        "Enquanto você dorme, ele encontra a vaga, adapta o seu currículo, escreve a carta e faz a candidatura. Abaixo de",
      bodyEm: "80% de encaixe",
      bodyTail: ", ele nem tenta.",
      note1: "— e você fica sabendo de cada envio.",
      note2: "— e pausa quando quiser.",
      note3: "— e aprova antes, se preferir.",
    },
    auto2: {
      headingLead: "A vaga abriu às 3h da manhã.",
      headingEm: "Adivinha quem já aplicou.",
      statLead: "Quem está desempregado gasta",
      statHours: "9 horas por semana",
      statMid:
        "procurando vaga. Num levantamento de 500 mil candidaturas, a candidatura fácil do LinkedIn respondeu",
      statEasy: "1,8%",
      statMid2: "; a adaptada, direto na empresa,",
      statTailored: "8,4%",
      statTail: ". Precisão vence volume.",
      sources:
        "Fontes: 9 h — Clarify Capital, 2024 · 1,8% e 8,4% — Jobloo, 2026 · 22% dos candidatos já usam bots — Greenhouse, 2025",
    },
    clique: {
      headingLead: "Cada vaga é um quebra-cabeça.",
      headingEm: "Você já tem a peça.",
      bodyLead: "Quando encaixa, faz",
      bodyEm: "clique",
      bodyTail: ".",
    },
    cta: {
      headingLead: "Descubra",
      headingEm: "sua nota.",
      body: "Teste com a vaga dos seus sonhos. A próxima candidatura pode ser a primeira que responde.",
      button: "Criar minha conta",
      noCard: "sem cartão",
    },
  },

  // As falas que o mascote segura na placa, um por capítulo.
  placards: {
    hero: { text: "Eu sou a peça que faltava entre você e a vaga." },
    dor: {
      text: "A cada 100 candidatos, 3 são chamados pra entrevista.",
      source: "Fonte: CareerPlug, 10 milhões de candidaturas, 2025",
    },
    robo: { text: "Seu currículo está sendo lido por um robô. Eu falo a língua dele." },
    vivo: {
      text: "Currículo adaptado recebe 2× mais entrevistas. Somente 1 em 4 candidatos adaptam o currículo para a vaga.",
      source: "Fontes: Huntr, 2025 · Novoresume, 2026",
    },
    vivo2: { text: "Cole a vaga. Eu mostro o que falta e conserto em 5 segundos." },
    notas: {
      text: "Quem nunca adapta tem 3× mais chance de terminar com zero entrevistas. As notas mostram o que ajustar.",
      source: "Fonte: Novoresume, 2026",
    },
    notas2: { text: "Eu li 244 currículos hoje. Sei exatamente por que o seu não passou." },
    auto: {
      text: "Eu reescrevo seu currículo pra cada vaga e só me candidato onde você tem chance.",
    },
    auto2: { text: "Você precisa dormir. Eu não." },
    clique: { text: "Um currículo. Uma versão pra cada vaga. Sem você reescrever nada." },
  },

  // A demo do currículo vivo: a Camila, três vagas, o mesmo currículo mudando.
  demo: {
    name: "Camila Ribeiro",
    chips: {
      vendas: "Vendedora · varejo de moda",
      atend: "Atendimento · plano de saúde",
      mkt: "Analista de marketing jr.",
    },
    labels: {
      match: "match",
      summary: "Resumo",
      strengths: "Pontos fortes (na ordem que a vaga quer)",
      experience: "Experiência",
      collapsed: "↓ recolhido para esta vaga",
      reading: "lendo…",
    },
    jobs: {
      vendas: {
        title: "Vendedora",
        summary:
          "Vendedora com 4 anos em varejo de moda, 14 metas batidas em 16 meses e a melhor conversão de provador da loja. Gosta de cliente difícil.",
        note: "A vaga pede meta e negociação. O Patch coloca isso no topo, reescreve o resumo com números de venda e mantém o estoque como ponto de organização.",
      },
      atend: {
        title: "Analista de atendimento",
        summary:
          "Profissional de atendimento com 5 anos entre loja e central telefônica, nota 4,8/5 em 3 mil atendimentos e histórico de resolver reclamações sem escalar.",
        note: 'Mesma pessoa, outra história: a experiência na central vira a protagonista, o "metas" sai do topo e o estoque encolhe — não ajuda aqui.',
      },
      mkt: {
        title: "Analista de marketing júnior",
        summary:
          "Em transição para marketing: gerencia o Instagram de uma loja (+2.400 seguidores/ano), escreve scripts de abordagem e mede resultado em planilha.",
        note: "A vaga pede social media e escrita. O Patch traz o Instagram da loja e os scripts de abordagem pro topo, e o estoque encolhe.",
      },
    },
    skills: {
      s1: "Atendimento ao cliente",
      s2: "Metas de vendas",
      s3: "Negociação",
      s4: "Organização de estoque",
      s5: "Excel",
      s6: "Instagram e Canva",
      s7: "Redação",
    },
    experience: {
      loja: {
        title: "Vendedora · Renner (2023 — hoje)",
        vendas:
          "Bateu a meta mensal em 14 dos últimos 16 meses; melhor conversão de provador da loja (38%).",
        atend:
          "Atende 60+ clientes por dia, resolve trocas e reclamações sem escalar pro gerente em 9 de 10 casos.",
        mkt: "Cuida do Instagram da loja: 3 posts por semana, +2.400 seguidores em um ano, campanhas de liquidação.",
      },
      call: {
        title: "Atendente · central de telefonia (2021 — 2023)",
        vendas: "Vendia planos por telefone: 22% de conversão, acima da média da equipe (15%).",
        atend: "Nota de satisfação 4,8/5 em 3 mil atendimentos; treinou 4 atendentes novos.",
        mkt: "Escrevia os scripts de abordagem usados pela equipe — a taxa de resposta subiu 12%.",
      },
      estoque: {
        title: "Auxiliar de estoque · supermercado (2019 — 2021)",
        vendas: "Organizou o estoque e reduziu ruptura de gôndola em 20%.",
        atend: "Organizou o estoque e reduziu ruptura de gôndola em 20%.",
        mkt: "Organizou o estoque e reduziu ruptura de gôndola em 20%.",
      },
    },
  },

  // Os três cartões de nota da Camila.
  scores: {
    style: {
      name: "Estilo & leitura pelo robô",
      what: "Se um software consegue ler seu currículo: layout, colunas, fontes.",
      why: "Duas colunas confundem o leitor automático.",
      fix: "Template B (coluna única).",
    },
    quality: {
      name: "Qualidade do currículo",
      what: "Quão bom ele é, independente de vaga.",
      why: "Completo, mas com experiências sem resultado.",
      fix: "Subir os dois subscores abaixo.",
    },
    match: {
      name: "Match com a vaga",
      what: "Quanto você encaixa nesta vaga específica.",
      why: "Palavras e contexto ótimos; requisitos abaixo.",
      fix: "Ver subscores.",
    },
    sub: {
      content: { name: "Conteúdo", fix: "Um resultado por experiência." },
      completeness: { name: "Completude", fix: "Preencher os dois campos." },
      keywords: { name: "Palavras-chave", fix: 'Usar "metas" na experiência da Renner.' },
      requirements: { name: "Requisitos", fix: "Somar os meses de estágio que faltam." },
      context: { name: "Contexto", fix: "Encurtar a parte de estoque." },
      culture: {
        name: "Fit cultural",
        fix: "só a nota — o porquê é protegido pra ninguém treinar o teste",
      },
    },
    whyLabel: "Por quê:",
    fixLabel: "Pra subir:",
  },

  // O feed da noite do auto-apply.
  night: {
    tonight: "esta noite",
    toggleOff: "ligar auto-apply",
    toggleOn: "auto-apply ligado",
    sleeping: "enquanto você dormia…",
    goodMorning: "bom dia · {sent} candidaturas enviadas, {skipped} puladas",
    adapting: "adaptando…",
    sent: "enviada ✓",
    skipped: "pulada · abaixo de 80%",
    openedAt: "abriu às 3h",
    rows: {
      r1: { role: "Vendedora · loja física", company: "Magalu" },
      r2: { role: "Analista de atendimento", company: "Amil" },
      r3: { role: "Social media pleno", company: "Agência X" },
      r4: { role: "Consultora de vendas", company: "Riachuelo" },
      r5: { role: "Analista de marketing jr.", company: "Startup Y" },
      r6: { role: "Atendimento · chat", company: "Vivo" },
    },
  },

  footer: {
    copyright: "© 2026 Patch Careers",
    privacy: "Privacidade",
    terms: "Termos",
    recruiterPrompt: "É recrutador?",
    recruiterLink: "Conheça o outro lado →",
  },

  a11y: {
    chapters: "Capítulos",
    goToChapter: "Ir para {title}",
  },
};

export const landingEn: TranslationDict = {
  header: {
    signIn: "Sign in",
    signUp: "Create account",
  },

  rail: {
    hero: "You're good",
    dor: "7.4 seconds",
    robo: "The robot",
    cena: "Not evil",
    vivo: "Per job",
    vivo2: "Meet Camila",
    notas: "The scores",
    notas2: "Seven scores",
    auto: "Auto-apply",
    auto2: "Tonight",
    clique: "The piece",
    cta: "Your score",
  },

  chapters: {
    hero: {
      headingLead: "You're good.",
      headingSecond: "Your résumé",
      headingEm: "isn't saying so.",
      bodyLead: "A living résumé: rewritten for every job in",
      bodyEm: "5 seconds",
      bodyTail: ", built to clear the robot and reach a person.",
      inputPlaceholder: "Paste the job link or its text…",
      cta: "See my résumé for this job",
      reassurance: "You see the result before creating an account.",
    },
    dor: {
      statUnit: "s",
      heading: "That's how long a recruiter takes to decide about you.",
      bodyLead: "Every opening gets",
      bodyApplications: "{count} applications",
      bodyRatio: "6 in 10 Brazilians",
      bodyTail: "never hear back.",
      sources:
        "Sources: 7.4 s — Ladders eye-tracking study, 2018 · 244 — Greenhouse, 2025 · 3 — CareerPlug, 2025 · 6 in 10 — Indeed Brazil, 2025",
    },
    robo: {
      headingLead: "Before you convince the recruiter,",
      headingEm: "convince the robot.",
      body: 'Software reads your résumé before any person does. It looks for the job\'s words. If you wrote "customer service" and the posting asked for "support", to it you don\'t qualify.',
      statTail:
        "of Brazilian companies already screen résumés with AI. In the US, 97.8% of the Fortune 500 use a robot — and 88% of them admit it discards qualified people.",
      gupyLead: "On Gupy alone,",
      gupyMillions: "{count} million",
      gupyMid: "applications a month pass through the filter before anyone reads them. Fewer than",
      gupyPercent: "1%",
      gupyTail: "become a hire.",
      sources:
        "Sources: 68% — Caju and Fundação Dom Cabral, 2026 · 97.8% — Jobscan, 2025 · 88% — Harvard Business School, Hidden Workers, 2021 · 15 million and 1% — Gupy, via O Tempo, 2024",
    },
    cena: {
      heading: "The robot is dumb, not evil.",
      robotSays: "hey, I heard that",
      translatingLabel: "translating…",
      translationLabel: "translation",
      translation: "hey, I heard that.",
      oops: "oops.",
    },
    vivo: {
      headingLead: "Every job wants to see a",
      headingEm: "different version",
      headingTail: "of you.",
      bodyLead: "You write",
      bodyEm: "one résumé",
      bodyTail:
        ". For every job, Patch highlights what matters, hides what gets in the way and speaks that company's language — in 5 seconds.",
      statLead: "A résumé carrying the job's exact title gets",
      statInterviews: "{count}× more interviews",
      statMid: ". Tailoring by hand takes",
      statMinutes: "30 to 90 minutes",
      statTail: "per job — which is why only",
      statShare: "25.7%",
      statEnd: "always tailor.",
      sources:
        "Sources: 10.6× — Jobscan, 2026 · 30–90 min — TailorForge, 2026 · 25.7% — Novoresume, 2026",
    },
    vivo2: {
      headingLead: "Tap a job and watch",
      headingEm: "Camila",
      headingTail: "change.",
    },
    notas: {
      headingLead: "Every score opens",
      headingEm: "the why.",
      body: "The feedback no company ever gave you. Seven scores, each with what it measures, why you got it and what to do to raise it. The colour tells you how close you are.",
      typoLead: "Bad writing is the number one reason for rejection in Brazil:",
      typoShareBr: "30%",
      typoMid: "of résumés are dropped for it, more than for lack of experience. In the US,",
      typoShareUs: "77%",
      typoTail: "of employers reject over a typo. The Content score warns you first.",
      sources: "Sources: 30% — Catho, survey of 400 recruiters, 2019 · 77% — CareerBuilder, 2023",
    },
    notas2: {
      heading: "Camila's seven scores.",
      legendPoor: "0–49",
      legendFair: "50–69",
      legendGood: "70–84",
      legendExcellent: "85–100",
    },
    auto: {
      eyebrow: "Auto-apply · only where it makes sense",
      headingLead: "Apply",
      headingEm: "while you sleep.",
      line1: "You need to sleep. It doesn't.",
      line2: "Hunger, sleep, discouragement, Sunday night. None of that exists for it.",
      bodyLead:
        "While you sleep, it finds the job, tailors your résumé, writes the cover letter and applies. Below",
      bodyEm: "80% fit",
      bodyTail: ", it doesn't even try.",
      note1: "— and you hear about every submission.",
      note2: "— and you pause it whenever you want.",
      note3: "— and you approve first, if you'd rather.",
    },
    auto2: {
      headingLead: "The job opened at 3 a.m.",
      headingEm: "Guess who already applied.",
      statLead: "People out of work spend",
      statHours: "9 hours a week",
      statMid: "job hunting. Across 500,000 applications, LinkedIn's easy apply got a reply",
      statEasy: "1.8%",
      statMid2: "of the time; the tailored one, straight to the company,",
      statTailored: "8.4%",
      statTail: ". Precision beats volume.",
      sources:
        "Sources: 9 h — Clarify Capital, 2024 · 1.8% and 8.4% — Jobloo, 2026 · 22% of candidates already use bots — Greenhouse, 2025",
    },
    clique: {
      headingLead: "Every job is a puzzle.",
      headingEm: "You already have the piece.",
      bodyLead: "When it fits, it goes",
      bodyEm: "click",
      bodyTail: ".",
    },
    cta: {
      headingLead: "Find out",
      headingEm: "your score.",
      body: "Try it with your dream job. Your next application could be the first one that answers.",
      button: "Create my account",
      noCard: "no card required",
    },
  },

  placards: {
    hero: { text: "I'm the piece that was missing between you and the job." },
    dor: {
      text: "For every 100 candidates, 3 get called for an interview.",
      source: "Source: CareerPlug, 10 million applications, 2025",
    },
    robo: { text: "Your résumé is being read by a robot. I speak its language." },
    vivo: {
      text: "A tailored résumé gets 2× more interviews. Only 1 in 4 candidates tailor theirs to the job.",
      source: "Sources: Huntr, 2025 · Novoresume, 2026",
    },
    vivo2: { text: "Paste the job. I'll show you what's missing and fix it in 5 seconds." },
    notas: {
      text: "People who never tailor are 3× more likely to end up with zero interviews. The scores show what to adjust.",
      source: "Source: Novoresume, 2026",
    },
    notas2: { text: "I read 244 résumés today. I know exactly why yours didn't make it." },
    auto: {
      text: "I rewrite your résumé for every job and only apply where you stand a chance.",
    },
    auto2: { text: "You need to sleep. I don't." },
    clique: { text: "One résumé. A version for every job. Without you rewriting a thing." },
  },

  demo: {
    name: "Camila Ribeiro",
    chips: {
      vendas: "Salesperson · fashion retail",
      atend: "Support · health insurance",
      mkt: "Jr. marketing analyst",
    },
    labels: {
      match: "match",
      summary: "Summary",
      strengths: "Strengths (in the order the job wants)",
      experience: "Experience",
      collapsed: "↓ collapsed for this job",
      reading: "reading…",
    },
    jobs: {
      vendas: {
        title: "Salesperson",
        summary:
          "Salesperson with 4 years in fashion retail, 14 targets hit in 16 months and the store's best fitting-room conversion. Likes a difficult customer.",
        note: "The job asks for targets and negotiation. Patch puts those on top, rewrites the summary with sales numbers and keeps the stockroom as an organisation point.",
      },
      atend: {
        title: "Support analyst",
        summary:
          "Support professional with 5 years across the shop floor and a call centre, a 4.8/5 satisfaction score over 3,000 tickets and a record of resolving complaints without escalating.",
        note: 'Same person, different story: the call-centre experience takes the lead, "targets" leaves the top and the stockroom shrinks — it doesn\'t help here.',
      },
      mkt: {
        title: "Junior marketing analyst",
        summary:
          "Moving into marketing: runs a store's Instagram (+2,400 followers/year), writes outreach scripts and tracks results in a spreadsheet.",
        note: "The job asks for social media and writing. Patch brings the store's Instagram and the outreach scripts to the top, and the stockroom shrinks.",
      },
    },
    skills: {
      s1: "Customer service",
      s2: "Sales targets",
      s3: "Negotiation",
      s4: "Stockroom organisation",
      s5: "Excel",
      s6: "Instagram and Canva",
      s7: "Copywriting",
    },
    experience: {
      loja: {
        title: "Salesperson · Renner (2023 — today)",
        vendas:
          "Hit the monthly target in 14 of the last 16 months; the store's best fitting-room conversion (38%).",
        atend:
          "Serves 60+ customers a day, resolving exchanges and complaints without the manager in 9 of 10 cases.",
        mkt: "Runs the store's Instagram: 3 posts a week, +2,400 followers in a year, clearance campaigns.",
      },
      call: {
        title: "Agent · phone carrier call centre (2021 — 2023)",
        vendas: "Sold plans by phone: 22% conversion, above the team average (15%).",
        atend: "4.8/5 satisfaction over 3,000 tickets; trained 4 new agents.",
        mkt: "Wrote the outreach scripts the team used — reply rate rose 12%.",
      },
      estoque: {
        title: "Stockroom assistant · supermarket (2019 — 2021)",
        vendas: "Organised the stockroom and cut shelf gaps by 20%.",
        atend: "Organised the stockroom and cut shelf gaps by 20%.",
        mkt: "Organised the stockroom and cut shelf gaps by 20%.",
      },
    },
  },

  scores: {
    style: {
      name: "Style & robot readability",
      what: "Whether software can read your résumé: layout, columns, fonts.",
      why: "Two columns confuse the automatic reader.",
      fix: "Template B (single column).",
    },
    quality: {
      name: "Résumé quality",
      what: "How good it is, independent of any job.",
      why: "Complete, but with experiences missing results.",
      fix: "Raise the two subscores below.",
    },
    match: {
      name: "Match with the job",
      what: "How well you fit this specific opening.",
      why: "Great words and context; requirements below.",
      fix: "See the subscores.",
    },
    sub: {
      content: { name: "Content", fix: "One result per experience." },
      completeness: { name: "Completeness", fix: "Fill in the two fields." },
      keywords: { name: "Keywords", fix: 'Use "targets" in the Renner experience.' },
      requirements: { name: "Requirements", fix: "Add the missing internship months." },
      context: { name: "Context", fix: "Shorten the stockroom part." },
      culture: {
        name: "Culture fit",
        fix: "score only — the why is protected so nobody can train for the test",
      },
    },
    whyLabel: "Why:",
    fixLabel: "To raise it:",
  },

  night: {
    tonight: "tonight",
    toggleOff: "turn on auto-apply",
    toggleOn: "auto-apply on",
    sleeping: "while you slept…",
    goodMorning: "good morning · {sent} applications sent, {skipped} skipped",
    adapting: "tailoring…",
    sent: "sent ✓",
    skipped: "skipped · below 80%",
    openedAt: "opened at 3 a.m.",
    rows: {
      r1: { role: "Salesperson · physical store", company: "Magalu" },
      r2: { role: "Support analyst", company: "Amil" },
      r3: { role: "Mid-level social media", company: "Agência X" },
      r4: { role: "Sales consultant", company: "Riachuelo" },
      r5: { role: "Jr. marketing analyst", company: "Startup Y" },
      r6: { role: "Support · chat", company: "Vivo" },
    },
  },

  footer: {
    copyright: "© 2026 Patch Careers",
    privacy: "Privacy",
    terms: "Terms",
    recruiterPrompt: "Are you a recruiter?",
    recruiterLink: "See the other side →",
  },

  a11y: {
    chapters: "Chapters",
    goToChapter: "Go to {title}",
  },
};
