/**
 * Match copy — recommendations and the job-related score breakdown. Both
 * locales side by side; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const matchPtBR: TranslationDict = {
  compatLabel: "de compatibilidade",
  recommended: {
    title: "Recomendadas pra você",
  },
  marketPulse: {
    label: "No mercado",
    caption: "de compatibilidade em {count} vagas recomendadas",
    captionOne: "de compatibilidade em 1 vaga recomendada",
    a11y: "No mercado: {range} de compatibilidade em {count} vagas recomendadas. Toque para ver por vaga",
    rowA11y: "{company}, {title}, {score}% de compatibilidade",
  },
  breakdown: {
    heading: "Compatibilidade com esta vaga",
    a11y: "{score} de compatibilidade do seu perfil com esta vaga",
    sub: {
      keyword: "Palavras-chave",
      requirements: "Requisitos",
      semantic: "Semântica",
    },
    gapsTitle: "O que falta no seu currículo",
    noGaps: "Seu currículo já cobre os principais sinais identificados nesta vaga.",
    improveCta: "Melhorar meu currículo",
    noResume: "Crie um currículo para ver sua compatibilidade.",
    error: "Não foi possível calcular a compatibilidade.",
    retry: "Tentar de novo",
  },
  explain: {
    a11y: "Como calculamos",
    title: "Como calculamos a compatibilidade",
    keyword: "Habilidades da vaga presentes no seu currículo.",
    requirements: "Anos, idiomas e certificações pedidos vs. os seus.",
    semantic: "Proximidade de sentido entre seu currículo e a descrição.",
    footnote: "Sinais sem dados suficientes são ignorados e os pesos se reequilibram.",
  },
};

export const matchEn: TranslationDict = {
  compatLabel: "compatibility",
  recommended: {
    title: "Recommended for you",
  },
  marketPulse: {
    label: "In the market",
    caption: "compatibility across {count} recommended jobs",
    captionOne: "compatibility across 1 recommended job",
    a11y: "In the market: {range} compatibility across {count} recommended jobs. Tap to see per job",
    rowA11y: "{company}, {title}, {score}% compatibility",
  },
  breakdown: {
    heading: "Compatibility with this job",
    a11y: "{score} compatibility between your profile and this job",
    sub: {
      keyword: "Keywords",
      requirements: "Requirements",
      semantic: "Semantic",
    },
    gapsTitle: "Missing from your resume",
    noGaps: "Your resume already covers the main signals identified in this job.",
    improveCta: "Improve my resume",
    noResume: "Create a resume to see your compatibility.",
    error: "Couldn't compute the compatibility.",
    retry: "Try again",
  },
  explain: {
    a11y: "How we calculate it",
    title: "How we calculate compatibility",
    keyword: "The job's skills found in your resume.",
    requirements: "Years, languages and certifications asked vs. yours.",
    semantic: "Meaning-level closeness between your resume and the description.",
    footnote: "Signals without enough data are skipped and the weights rebalance.",
  },
};
