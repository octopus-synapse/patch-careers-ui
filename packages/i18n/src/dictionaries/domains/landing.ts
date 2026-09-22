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
  resumeCompare: {
    original: "Original",
    genericRole: "Perfil profissional",
    specificRole: "Vendedora · varejo de moda",
    contact: "Contato profissional",
    summary: "Resumo profissional",
    experience: "Experiência",
    skills: "Competências",
    employer: "Vendedora · Renner",
    present: "atual",
    originalSummary: "Profissional com experiência em loja, vendas e atendimento ao público.",
    adaptedSummary:
      "Experiência em vendas no varejo, com metas atingidas em 14 de 16 meses e atendimento a mais de 60 clientes por dia.",
    originalBullet: "Atendimento, vendas, trocas e resolução de reclamações.",
    targets: "Meta mensal atingida em 14 de 16 meses.",
    customers: "Mais de 60 clientes atendidos por dia.",
    originalSkills: "Atendimento · Excel · Vendas",
    adaptedSkills: "Metas de vendas · Atendimento ao cliente · Excel",
    sameFacts: "Os mesmos fatos. Mais clareza para esta vaga.",
  },
  demoFlow: {
    example: "DEMONSTRAÇÃO · DADOS FICTÍCIOS",
    scroll: "Role para acompanhar a adaptação",
    job: "O QUE A VAGA PEDE",
    before: "SUA EXPERIÊNCIA ORIGINAL",
    after: "ADAPTADO PARA ESTA VAGA",
    role: "Vendas · varejo de moda",
    beforeText:
      "Atendimento em loja, vendas e resolução de reclamações. Meta mensal atingida em 14 de 16 meses; mais de 60 clientes atendidos por dia.",
    afterLead: "Vendas no varejo com",
    afterMark: "metas atingidas em 14 de 16 meses",
    afterTail: "e atendimento a mais de 60 clientes por dia.",
    changed: "O resultado que a vaga procura vem primeiro. Os fatos continuam os mesmos.",
    requirementsTitle: "O que a vaga pede.\nO que você já fez.",
    requirementsBody:
      "O Patch relaciona os requisitos à sua experiência para ajudar você a decidir o que destacar.",
    req1: "Foco em metas",
    req2: "Atendimento ao cliente",
    req3: "Resolução de reclamações",
    proof1: "14 metas atingidas em 16 meses",
    proof2: "Mais de 60 clientes atendidos por dia",
    proof3: "9 de 10 casos resolvidos sem escalar ao gerente",
    connections: "REQUISITOS → EXPERIÊNCIA",
    twoTitle: "Mesma experiência.\nDuas formas de apresentar.",
    twoBody:
      "A vaga muda. Sua história não. Veja como os mesmos fatos ganham uma ordem e um foco diferentes.",
    source: "Camila · experiência em varejo",
    sourceText:
      "Atendia mais de 60 clientes por dia, atingiu a meta em 14 de 16 meses e resolvia 9 de 10 trocas e reclamações sem escalar ao gerente.",
    sales: "Para uma vaga de vendas",
    salesText:
      "Meta mensal atingida em 14 de 16 meses, com atendimento a mais de 60 clientes por dia e resolução de trocas e reclamações.",
    support: "Para uma vaga de atendimento",
    supportText:
      "Atendimento a mais de 60 clientes por dia, resolvendo 9 de 10 trocas e reclamações sem escalar ao gerente. Experiência também com metas de vendas.",
    salesFocus: "DESTAQUE: RESULTADO EM VENDAS",
    supportFocus: "DESTAQUE: ATENDIMENTO E RESOLUÇÃO",
    signup: "Você cria sua conta para adaptar seu currículo. Sem cartão de crédito.",
    variantA: "Versão A · evidências em 3 seções",
    variantB: "Versão B · evidências em 6 seções",
    groupSilence: "6 em 10",
    groupSilenceText: "candidatos não recebem retorno após se candidatar.",
    groupFilters: "Filtros podem deixar talentos de fora.",
    groupFiltersText:
      "Sistemas de recrutamento podem ordenar e filtrar candidaturas por critérios da vaga, antes da leitura humana.",
  },
  scroll: {
    eyebrow: "SUA EXPERIÊNCIA. BEM APRESENTADA.",
    heroLead: "Você é bom.",
    heroEnd: "Seu currículo precisa mostrar isso.",
    heroBody:
      "Um perfil. Um currículo adaptado para cada vaga. O Patch destaca sua experiência relevante e mostra o que melhorar. Você revisa antes de enviar.",
    start: "Adaptar meu currículo para uma vaga",
    explore: "Veja como funciona",
    example: "EXEMPLO ILUSTRATIVO",
    preview: "Seu perfil, no contexto da vaga",
    role: "Vendedora · varejo de moda",
    match: "Compatibilidade com a vaga",
    review: "Pronto para sua revisão",
    evidence: "O CAMINHO ATÉ A ENTREVISTA",
    evidenceTitle: "Ser bom é só o começo.\nSer visto também importa.",
    evidenceBody:
      "Pouco tempo de leitura. Muitas candidaturas. Filtros antes da conversa. Entender o processo ajuda você a se preparar.",
    productTitle: "A experiência é sua.\nO foco muda com a vaga.",
    productBody:
      "Você não precisa começar do zero a cada candidatura. O Patch ajuda a reorganizar sua experiência e destacar o que é relevante para cada oportunidade.",
    versionsTitle: "O que muda é o que vem primeiro.",
    versionsBody:
      "Veja como o resumo e os pontos fortes ganham um novo foco. Os exemplos já estão abertos: é só continuar rolando.",
    profileLabel: "Perfil de exemplo",
    profileBody:
      "Varejo, atendimento e comunicação. Um repertório que pode ser apresentado de formas diferentes.",
    scoresTag: "02 / ENTENDA ANTES DE ENVIAR",
    scoresTitle: "Mais que uma nota.\nUma direção para melhorar.",
    scoresBody:
      "Veja como seu currículo é lido, a qualidade do conteúdo e a compatibilidade com a vaga. Cada resultado vem acompanhado de contexto e próximos passos.",
    scoreScale: "Notas ilustrativas · escala de 0 a 100",
    details: "O QUE COMPÕE O RESULTADO",
    workflowTag: "03 / VOCÊ DECIDE O PRÓXIMO PASSO",
    workflowTitle: "Da vaga ao envio.\nCom clareza em cada etapa.",
    workflowBody:
      "O Patch ajuda na preparação. Você confere as mudanças e faz a candidatura no site da empresa.",
    step1Title: "Escolha a oportunidade",
    step1Body: "Abra uma vaga e veja como os requisitos se relacionam com sua experiência.",
    step2Title: "Prepare e revise",
    step2Body: "Adapte o currículo para a oportunidade e confira cada mudança antes de usar.",
    step3Title: "Envie com intenção",
    step3Body: "Candidate-se no site da empresa e acompanhe o resultado no seu ritmo.",
    closingTag: "SUA HISTÓRIA TEM VALOR",
    closingTitle: "Apresente o que você tem de melhor.",
    closingBody:
      "Sua próxima candidatura pode começar com um currículo mais claro, relevante e fiel à sua experiência.",
    sourceNote:
      "Os estudos têm públicos e metodologias diferentes. Consulte as fontes de cada indicador.",
    skip: "Ir para o conteúdo",
    metricStyle: "Leitura",
    metricQuality: "Conteúdo",
    metricMatch: "Match",
  },
  header: {
    signIn: "Entrar",
    signUp: "Criar conta",
  },

  // Navbar pública (menu hambúrguer padrão Airbnb + modal de idioma/tema).
  nav: {
    intro: "Início",
    context: "Contexto",
    how: "Como funciona",
    scores: "Diagnóstico",
    start: "Começar",
    howItWorks: "Como funciona",
    difference: "O diferencial",
    goodToKnow: "Bom saber",
    getStarted: "Começar",
    openMenu: "Abrir menu",
    close: "Fechar",
    langRegion: "Idioma e região",
    theme: "Tema",
    help: "Ajuda",
    privacy: "Privacidade",
    termsOfUse: "Termos de uso",
    translateTitle: "Tradução",
    translateSub: "O Patch fala a sua língua — currículos saem no idioma da vaga.",
    seeDemo: "Ver o demo",
    seeDemoSub: "Cole uma vaga e veja seu currículo reescrito.",
    suggested: "Sugeridos",
    langPt: "Português",
    langPtRegion: "Brasil",
    langEn: "English",
    langEnRegion: "United States",
    systemHint: "Segue o dispositivo",
  },
  languageConfirm: {
    title: "Qual idioma você prefere?",
    confirm: "Continuar neste idioma",
  },

  // Títulos curtos do trilho lateral de capítulos.
  rail: {
    hero: "Você é bom",
    manifesto: "Além do papel",
    versions: "Suas versões",
    connection: "A descoberta",
    dor: "7,4 segundos",
    interviews: "3 em 100",
    silence: "6 em 10",
    robo: "IA no recrutamento",
    filter: "Antes do recrutador",
    qualified: "Talento invisível",
    cena: "Não malvado",
    vivo: "Por vaga",
    vivo2: "A Camila",
    notas: "As notas",
    notas2: "Sete notas",
    auto: "Prepare-se",
    auto2: "Seu envio",
    clique: "A peça",
    cta: "Comece aqui",
  },

  cinema: {
    manifesto: {
      eyebrow: "O papel é só o começo",
      lead: "Você é",
      emphasis: "muito mais.",
      caption: "Sua história não cabe em uma página.",
      ghost: "POTENCIAL",
      skill1: "Experiência",
      skill2: "Ideias",
      skill3: "Conquistas",
    },
    versions: {
      eyebrow: "Uma história. Infinitas possibilidades.",
      lead: "Todas as suas versões.",
      emphasis: "Um só você.",
      caption: "A mesma essência. O destaque certo para cada vaga.",
      role1: "Criatividade",
      role2: "Estratégia",
      role3: "Liderança",
      profile: "Sua próxima versão",
      detail: "Experiência que faz sentido",
    },
    connection: {
      eyebrow: "Algumas coisas você só sente",
      lead: "Quando faz sentido,",
      emphasis: "encaixa.",
      caption: "Você. A oportunidade. A conexão certa.",
    },
  },

  statistics: {
    robo: {
      number: "",
      heading: "A IA está ganhando espaço no recrutamento.",
      body: "O uso ou teste de IA generativa no recrutamento passou de 27% para 37% entre as edições 2024 e 2025 do estudo do LinkedIn.",
      source: "LinkedIn · Future of Recruiting 2025",
      chartTitle: "",
      chartChange: "Uso de IA generativa no recrutamento",
      chartCaption: "Uso ou experimentação · pesquisa internacional",
      chartEditions: "Edições do relatório",
      chartLabel:
        "Uso ou experimentação de IA generativa no recrutamento: 27% na edição 2024 e 37% na edição 2025. Aumento de 10 pontos percentuais.",
    },
    filter: {
      number: "",
      heading: "Antes do recrutador, vem o robô.",
      body: "Sistemas de recrutamento podem filtrar e ordenar candidaturas com base nos critérios da vaga, como formação e experiência. É uma etapa que pode acontecer antes da leitura humana.",
      source: "Harvard Business School e Accenture · Hidden Workers, 2021.",
    },
    qualified: {
      number: "88%",
      heading: "Gente qualificada também fica pelo caminho.",
      body: "dos empregadores pesquisados que usam sistemas de gestão de recrutamento reconhecem que seus filtros excluem candidatos capazes para vagas de alta qualificação por não atenderem aos critérios exatos da descrição.",
      source:
        "Harvard Business School e Accenture · Hidden Workers, 2021 · EUA, Reino Unido e Alemanha · Figura 10.",
    },
    dor: {
      number: "7,4",
      heading: "É o tempo que um recrutador leva para decidir sobre você.",
      body: "Uma vida inteira de trabalho. Uma janela tão pequena para mostrá-la.",
      source:
        "Ladders · 2018 — Tempo médio de triagem inicial em um estudo de rastreamento ocular.",
    },
    interviews: {
      number: "3 em 100",
      heading: "candidatos conseguem uma entrevista.",
      body: "A distância entre se candidatar e ser ouvido é maior do que deveria.",
      source: "CareerPlug · 2025 — Taxa de candidaturas que chegam à entrevista.",
    },
    silence: {
      number: "6 em 10",
      heading: "candidatos não recebem retorno depois de se candidatar.",
      body: "",
      source: "Indeed Brasil · 2025 — Dados reportados pelo Universo do Seguro, agosto de 2025.",
    },
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
      eyebrow: "Da vaga ao currículo",
      headingLead: "Prepare-se",
      headingEm: "pra vaga certa.",
      line1: "Veja quanto seu perfil combina com a vaga.",
      line2: "Entenda o que falta e decida o próximo passo.",
      bodyLead: "Quando quiser, o Patch personaliza seu currículo. Você revê",
      bodyEm: "cada mudança",
      bodyTail: " e envia sua candidatura no site da vaga.",
      note1: "— Match sem questionário obrigatório.",
      note2: "— revisão antes de usar o currículo.",
      note3: "— envio externo sob seu controle.",
    },
    auto2: {
      headingLead: "Seu próximo envio começa",
      headingEm: "com uma escolha melhor.",
      step1: "1. Escolha uma vaga e abra o Match.",
      step2: "2. Prepare e revise seu currículo para ela.",
      step3: "3. Envie pelo site da empresa e acompanhe o resultado.",
      statLead: "O Patch mostra",
      statHours: "compatibilidade",
      statMid: "e ajuda você a preparar",
      statEasy: "um currículo específico",
      statMid2: ". Você revisa",
      statTailored: "cada mudança",
      statTail: " antes de enviar no site da vaga.",
      sources: "",
    },
    clique: {
      headingLead: "Cada vaga é um quebra-cabeça.",
      headingEm: "Você já tem a peça.",
      bodyLead: "Quando encaixa, faz",
      bodyEm: "clique",
      bodyTail: ".",
    },
    cta: {
      eyebrow: "O PRÓXIMO PASSO É SEU",
      headingLead: "Sua próxima vaga.",
      headingEm: "Começa aqui.",
      body: "Veja como seu currículo se encaixa na vaga — e o que melhorar antes de enviar.",
      button: "Criar minha conta",
      noCard: "Sem cartão de crédito.",
      steps: {
        profile: "Conte sua experiência",
        job: "Escolha uma vaga",
        fit: "Descubra o que destacar",
      },
    },
  },

  // As falas que o mascote segura na placa, um por capítulo.
  placards: {
    hero: { text: "Eu sou a peça que faltava entre você e a vaga." },
    dor: {
      text: "A cada 100 candidatos, 3 são chamados pra entrevista.",
      source: "Fonte: CareerPlug, 10 milhões de candidaturas, 2025",
    },
    robo: {
      text: "Seu currículo está sendo lido por um robô. Eu falo a língua dele.",
    },
    vivo: {
      text: "Currículo adaptado recebe 2× mais entrevistas. Somente 1 em 4 candidatos adaptam o currículo para a vaga.",
      source: "Fontes: Huntr, 2025 · Novoresume, 2026",
    },
    vivo2: {
      text: "Cole a vaga. Eu mostro o que falta e conserto em 5 segundos.",
    },
    notas: {
      text: "Quem nunca adapta tem 3× mais chance de terminar com zero entrevistas. As notas mostram o que ajustar.",
      source: "Fonte: Novoresume, 2026",
    },
    notas2: {
      text: "Eu li 244 currículos hoje. Sei exatamente por que o seu não passou.",
    },
    auto: {
      text: "Eu reescrevo seu currículo pra cada vaga e só me candidato onde você tem chance.",
    },
    auto2: { text: "Você precisa dormir. Eu não." },
    clique: {
      text: "Um currículo. Uma versão pra cada vaga. Sem você reescrever nada.",
    },
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
      keywords: {
        name: "Palavras-chave",
        fix: 'Usar "metas" na experiência da Renner.',
      },
      requirements: {
        name: "Requisitos",
        fix: "Somar os meses de estágio que faltam.",
      },
      context: { name: "Contexto", fix: "Encurtar a parte de estoque." },
    },
    whyLabel: "Por quê:",
    fixLabel: "Pra subir:",
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
  resumeCompare: {
    original: "Original",
    genericRole: "Professional profile",
    specificRole: "Sales associate · fashion retail",
    contact: "Professional contact",
    summary: "Professional summary",
    experience: "Experience",
    skills: "Skills",
    employer: "Sales associate · Renner",
    present: "present",
    originalSummary: "Professional with experience in retail, sales, and customer service.",
    adaptedSummary:
      "Retail sales experience, meeting monthly targets in 14 of 16 months and serving over 60 customers a day.",
    originalBullet: "Customer service, sales, returns, and complaint resolution.",
    targets: "Monthly target met in 14 of 16 months.",
    customers: "Over 60 customers served per day.",
    originalSkills: "Customer service · Excel · Sales",
    adaptedSkills: "Sales targets · Customer service · Excel",
    sameFacts: "The same facts. A clearer fit for this role.",
  },
  demoFlow: {
    example: "DEMONSTRATION · FICTIONAL DATA",
    scroll: "Scroll to follow the adaptation",
    job: "WHAT THE ROLE ASKS FOR",
    before: "YOUR ORIGINAL EXPERIENCE",
    after: "TAILORED TO THIS ROLE",
    role: "Sales · fashion retail",
    beforeText:
      "In-store customer service, sales, and complaint resolution. Monthly target met in 14 of 16 months; over 60 customers served per day.",
    afterLead: "Retail sales experience with",
    afterMark: "monthly targets met in 14 of 16 months",
    afterTail: "and over 60 customers served per day.",
    changed: "The result the role asks for comes first. The facts stay the same.",
    requirementsTitle: "What the role needs.\nWhat you’ve already done.",
    requirementsBody:
      "Patch connects the requirements to your experience to help you decide what to highlight.",
    req1: "Sales targets",
    req2: "Customer service",
    req3: "Complaint resolution",
    proof1: "14 monthly targets met in 16 months",
    proof2: "Over 60 customers served per day",
    proof3: "9 in 10 cases resolved without escalating to a manager",
    connections: "REQUIREMENTS → EXPERIENCE",
    twoTitle: "The same experience.\nTwo ways to present it.",
    twoBody:
      "The role changes. Your history doesn’t. See how the same facts take on a different order and focus.",
    source: "Camila · retail experience",
    sourceText:
      "Served over 60 customers a day, met the monthly target in 14 of 16 months, and resolved 9 in 10 returns and complaints without escalating to a manager.",
    sales: "For a sales role",
    salesText:
      "Met the monthly target in 14 of 16 months, serving over 60 customers a day and handling returns and complaints.",
    support: "For a customer service role",
    supportText:
      "Served over 60 customers a day, resolving 9 in 10 returns and complaints without escalating to a manager. Also experienced in working toward sales targets.",
    salesFocus: "FOCUS: SALES RESULTS",
    supportFocus: "FOCUS: SERVICE AND RESOLUTION",
    signup: "Create your account to tailor your resume. No credit card required.",
    variantA: "Version A · evidence in 3 sections",
    variantB: "Version B · evidence in 6 sections",
    groupSilence: "6 in 10",
    groupSilenceText: "candidates hear nothing back after applying.",
    groupFilters: "Filters can leave qualified people out.",
    groupFiltersText:
      "Recruiting systems can rank and filter applications against job criteria before a person reads them.",
  },
  scroll: {
    eyebrow: "YOUR EXPERIENCE. WELL PRESENTED.",
    heroLead: "You’re good.",
    heroEnd: "Your resume should show it.",
    heroBody:
      "One profile. A resume tailored to each role. Patch highlights your relevant experience and shows what to improve. You review before you apply.",
    start: "Tailor my resume to a role",
    explore: "See how it works",
    example: "ILLUSTRATIVE EXAMPLE",
    preview: "Your profile, in the context of the role",
    role: "Sales associate · fashion retail",
    match: "Match with the role",
    review: "Ready for your review",
    evidence: "THE PATH TO AN INTERVIEW",
    evidenceTitle: "Being good is a start.\nBeing seen matters too.",
    evidenceBody:
      "Brief reviews. Many applications. Filters before a conversation. Understanding the process helps you prepare.",
    productTitle: "Your experience stays.\nThe focus fits the role.",
    productBody:
      "You don’t need to start over with every application. Patch helps you organize your experience and highlight what matters for each opportunity.",
    versionsTitle: "What changes is what comes first.",
    versionsBody:
      "See how the summary and strengths take on a new focus. Every example is already open: just keep scrolling.",
    profileLabel: "Example profile",
    profileBody:
      "Retail, customer service, and communication. A range of experience that can be presented in different ways.",
    scoresTag: "02 / UNDERSTAND BEFORE YOU APPLY",
    scoresTitle: "More than a score.\nA direction to improve.",
    scoresBody:
      "See how your resume reads, the quality of its content, and its fit with the role. Each result includes context and next steps.",
    scoreScale: "Illustrative scores · scale of 0 to 100",
    details: "WHAT MAKES UP THE RESULT",
    workflowTag: "03 / YOU CHOOSE WHAT COMES NEXT",
    workflowTitle: "From opportunity to application.\nClarity at every step.",
    workflowBody:
      "Patch helps you prepare. You review the changes and apply on the company’s website.",
    step1Title: "Choose an opportunity",
    step1Body: "Open a role and see how its requirements connect with your experience.",
    step2Title: "Prepare and review",
    step2Body: "Tailor your resume to the opportunity and review each change before using it.",
    step3Title: "Apply with intention",
    step3Body: "Apply on the company’s website and track the outcome at your own pace.",
    closingTag: "YOUR STORY HAS VALUE",
    closingTitle: "Put your best experience forward.",
    closingBody:
      "Your next application can start with a clearer, more relevant resume that stays true to your experience.",
    sourceNote:
      "The studies cover different populations and use different methods. See the sources for each finding.",
    skip: "Skip to content",
    metricStyle: "Readability",
    metricQuality: "Content",
    metricMatch: "Match",
  },
  header: {
    signIn: "Sign in",
    signUp: "Create account",
  },

  nav: {
    intro: "Intro",
    context: "Context",
    how: "How it works",
    scores: "Your results",
    start: "Get started",
    howItWorks: "How it works",
    difference: "The difference",
    goodToKnow: "Good to know",
    getStarted: "Get started",
    openMenu: "Open menu",
    close: "Close",
    langRegion: "Language & region",
    theme: "Theme",
    help: "Help",
    privacy: "Privacy",
    termsOfUse: "Terms of use",
    translateTitle: "Translation",
    translateSub: "Patch speaks your language — resumes ship in the job's language.",
    seeDemo: "See the demo",
    seeDemoSub: "Paste a job and watch your resume rewrite.",
    suggested: "Suggested",
    langPt: "Português",
    langPtRegion: "Brasil",
    langEn: "English",
    langEnRegion: "United States",
    systemHint: "Follows your device",
  },
  languageConfirm: {
    title: "Which language do you prefer?",
    confirm: "Continue in this language",
  },

  rail: {
    hero: "You're good",
    manifesto: "Beyond the page",
    versions: "Your versions",
    connection: "The discovery",
    dor: "7.4 seconds",
    interviews: "3 in 100",
    silence: "6 in 10",
    robo: "AI in recruiting",
    filter: "Before the recruiter",
    qualified: "Hidden talent",
    cena: "Not evil",
    vivo: "Per job",
    vivo2: "Meet Camila",
    notas: "The scores",
    notas2: "Seven scores",
    auto: "Prepare",
    auto2: "Your next step",
    clique: "The piece",
    cta: "Start here",
  },

  cinema: {
    manifesto: {
      eyebrow: "The page is just the beginning",
      lead: "You are",
      emphasis: "so much more.",
      caption: "Your story goes beyond a page.",
      ghost: "POTENTIAL",
      skill1: "Experience",
      skill2: "Ideas",
      skill3: "Achievements",
    },
    versions: {
      eyebrow: "One story. Endless possibilities.",
      lead: "All your versions.",
      emphasis: "Still you.",
      caption: "The same essence. The right focus for every role.",
      role1: "Creativity",
      role2: "Strategy",
      role3: "Leadership",
      profile: "Your next version",
      detail: "Experience that makes sense",
    },
    connection: {
      eyebrow: "Some things you just feel",
      lead: "When it feels right,",
      emphasis: "it clicks.",
      caption: "You. The opportunity. The right connection.",
    },
  },

  statistics: {
    robo: {
      number: "",
      heading: "AI is gaining ground in recruiting.",
      body: "The use or testing of generative AI in recruiting rose from 27% to 37% between the 2024 and 2025 editions of LinkedIn’s study.",
      source: "LinkedIn · Future of Recruiting 2025",
      chartTitle: "",
      chartChange: "Usage of Generative AI in recruiting",
      chartCaption: "Use or experimentation · international survey",
      chartEditions: "Report editions",
      chartLabel:
        "Use or experimentation with generative AI in recruiting: 27% in the 2024 edition and 37% in the 2025 edition. An increase of 10 percentage points.",
    },
    filter: {
      number: "",
      heading: "Before the recruiter comes the robot.",
      body: "Recruiting systems can filter and rank applications against job criteria, such as education and experience. This can happen before a person reads your resume.",
      source: "Harvard Business School and Accenture · Hidden Workers, 2021.",
    },
    qualified: {
      number: "88%",
      heading: "Qualified people get filtered out, too.",
      body: "of surveyed employers using recruiting management systems acknowledge that their filters exclude capable candidates for high-skill roles because they do not meet the exact job-description criteria.",
      source:
        "Harvard Business School and Accenture · Hidden Workers, 2021 · US, UK and Germany · Figure 10.",
    },
    dor: {
      number: "7.4",
      heading: "That's how long a recruiter takes to decide about you.",
      body: "A whole working life. A very small window to show it.",
      source: "Ladders · 2018 — Average initial resume screening in an eye-tracking study.",
    },
    interviews: {
      number: "3 in 100",
      heading: "candidates get an interview.",
      body: "The distance between applying and being heard is bigger than it should be.",
      source: "CareerPlug · 2025 — Applicant-to-interview rate in recruiting benchmarks.",
    },
    silence: {
      number: "6 in 10",
      heading: "candidates hear nothing back after applying.",
      body: "",
      source: "Indeed Brasil · 2025 — Figures reported by Universo do Seguro, August 2025.",
    },
  },
  chapters: {
    hero: {
      headingLead: "You're good.",
      headingSecond: "Your resume",
      headingEm: "isn't saying so.",
      bodyLead: "A living resume: rewritten for every job in",
      bodyEm: "5 seconds",
      bodyTail: ", built to clear the robot and reach a person.",
      inputPlaceholder: "Paste the job link or its text…",
      cta: "See my resume for this job",
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
      bodyEm: "one resume",
      bodyTail:
        ". For every job, Patch highlights what matters, hides what gets in the way and speaks that company's language — in 5 seconds.",
      statLead: "A resume carrying the job's exact title gets",
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
      typoMid: "of resumes are dropped for it, more than for lack of experience. In the US,",
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
      eyebrow: "From job to resume",
      headingLead: "Get ready",
      headingEm: "for the right role.",
      line1: "See how your profile matches a job.",
      line2: "Understand what's missing and choose your next step.",
      bodyLead: "When you want, Patch tailors your resume. You review",
      bodyEm: "every change",
      bodyTail: " and submit on the job site yourself.",
      note1: "— Match needs no mandatory questionnaire.",
      note2: "— review before using the resume.",
      note3: "— external submission stays in your hands.",
    },
    auto2: {
      headingLead: "Your next application starts",
      headingEm: "with a better choice.",
      step1: "1. Pick a job and open Match.",
      step2: "2. Prepare and review your resume for it.",
      step3: "3. Apply on the company site and track the outcome.",
      statLead: "Patch shows",
      statHours: "compatibility",
      statMid: "and helps you prepare",
      statEasy: "a job-specific resume",
      statMid2: ". You review",
      statTailored: "every change",
      statTail: " before submitting on the job site.",
      sources: "",
    },
    clique: {
      headingLead: "Every job is a puzzle.",
      headingEm: "You already have the piece.",
      bodyLead: "When it fits, it goes",
      bodyEm: "click",
      bodyTail: ".",
    },
    cta: {
      eyebrow: "YOUR NEXT MOVE IS YOURS",
      headingLead: "Your next chapter.",
      headingEm: "Starts here.",
      body: "See how your resume fits the role — and what to improve before you apply.",
      button: "Create my account",
      noCard: "No credit card required.",
      steps: {
        profile: "Add your experience",
        job: "Choose a role",
        fit: "Find what makes you stand out",
      },
    },
  },

  placards: {
    hero: { text: "I'm the piece that was missing between you and the job." },
    dor: {
      text: "For every 100 candidates, 3 get called for an interview.",
      source: "Source: CareerPlug, 10 million applications, 2025",
    },
    robo: {
      text: "Your resume is being read by a robot. I speak its language.",
    },
    vivo: {
      text: "A tailored resume gets 2× more interviews. Only 1 in 4 candidates tailor theirs to the job.",
      source: "Sources: Huntr, 2025 · Novoresume, 2026",
    },
    vivo2: {
      text: "Paste the job. I'll show you what's missing and fix it in 5 seconds.",
    },
    notas: {
      text: "People who never tailor are 3× more likely to end up with zero interviews. The scores show what to adjust.",
      source: "Source: Novoresume, 2026",
    },
    notas2: {
      text: "I read 244 resumes today. I know exactly why yours didn't make it.",
    },
    auto: {
      text: "I rewrite your resume for every job and only apply where you stand a chance.",
    },
    auto2: { text: "You need to sleep. I don't." },
    clique: {
      text: "One resume. A version for every job. Without you rewriting a thing.",
    },
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
      what: "Whether software can read your resume: layout, columns, fonts.",
      why: "Two columns confuse the automatic reader.",
      fix: "Template B (single column).",
    },
    quality: {
      name: "Resume quality",
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
      keywords: {
        name: "Keywords",
        fix: 'Use "targets" in the Renner experience.',
      },
      requirements: {
        name: "Requirements",
        fix: "Add the missing internship months.",
      },
      context: { name: "Context", fix: "Shorten the stockroom part." },
    },
    whyLabel: "Why:",
    fixLabel: "To raise it:",
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
