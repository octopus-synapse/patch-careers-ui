/**
 * Match copy — the "Recomendadas pra você" section, the blur/lock gate that
 * invites the user into the fit questionnaire, and the match breakdown. Both
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
  gate: {
    title: "Descubra suas vagas ideais",
    body: "Responda 25 perguntas rápidas e veja o quanto você combina com cada vaga.",
    ctaNever: "Descobrir meu fit",
    ctaExpired: "Revalidar meu fit",
  },
  breakdown: {
    heading: "Compatibilidade com esta vaga",
    sub: {
      keyword: "Palavras-chave",
      requirements: "Requisitos",
      semantic: "Semântica",
      fit: "Fit",
    },
    gapsTitle: "O que falta no seu currículo",
    improveCta: "Melhorar meu currículo",
    noResume: "Crie um currículo para ver sua compatibilidade.",
    error: "Não foi possível calcular a compatibilidade.",
    retry: "Tentar de novo",
  },
  explain: {
    a11y: "Como calculamos",
    title: "Como calculamos a compatibilidade",
    keyword: "Palavras-chave — habilidades da vaga presentes no seu currículo.",
    requirements: "Requisitos — anos, idiomas e certificações pedidos vs. os seus.",
    semantic: "Semântica — proximidade de sentido entre seu currículo e a descrição.",
    fit: "Perfil — alinhamento do seu perfil comportamental com o papel.",
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
  gate: {
    title: "Discover your ideal jobs",
    body: "Answer 25 quick questions and see how well you fit each job.",
    ctaNever: "Discover my fit",
    ctaExpired: "Revalidate my fit",
  },
  breakdown: {
    heading: "Compatibility with this job",
    sub: {
      keyword: "Keywords",
      requirements: "Requirements",
      semantic: "Semantic",
      fit: "Fit",
    },
    gapsTitle: "Missing from your resume",
    improveCta: "Improve my resume",
    noResume: "Create a resume to see your compatibility.",
    error: "Couldn't compute the compatibility.",
    retry: "Try again",
  },
  explain: {
    a11y: "How we calculate it",
    title: "How we calculate compatibility",
    keyword: "Keywords — the job's skills found in your resume.",
    requirements: "Requirements — years, languages and certifications asked vs. yours.",
    semantic: "Semantic — meaning-level closeness between your resume and the description.",
    fit: "Profile — how your behavioral profile aligns with the role.",
    footnote: "Signals without enough data are skipped and the weights rebalance.",
  },
};
