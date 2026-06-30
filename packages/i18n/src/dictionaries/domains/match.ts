/**
 * Match copy — the "Recomendadas pra você" section, the blur/lock gate that
 * invites the user into the fit questionnaire, and the match breakdown. Both
 * locales side by side; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const matchPtBR: TranslationDict = {
  matchLabel: "Match",
  recommended: {
    title: "Recomendadas pra você",
  },
  gate: {
    title: "Descubra suas vagas ideais",
    body: "Responda 25 perguntas rápidas e veja o quanto você combina com cada vaga.",
    ctaNever: "Descobrir meu fit",
    ctaExpired: "Revalidar meu fit",
  },
  breakdown: {
    heading: "Seu match com esta vaga",
    overallLabel: "Compatibilidade",
    sub: {
      keyword: "Palavras-chave",
      requirements: "Requisitos",
      semantic: "Semântica",
      fit: "Perfil",
    },
    gapsTitle: "O que falta no seu currículo",
    improveCta: "Melhorar meu currículo",
    tailorCta: "Adaptar currículo para esta vaga",
    tailoring: "Adaptando…",
    tailorLocked: "Melhore seu currículo (mín. 50 de qualidade) para adaptá-lo à vaga.",
    tailorSuccess: "Currículo adaptado! Veja na aba Currículos.",
    tailorError: "Não foi possível adaptar agora. Tente mais tarde.",
    noResume: "Crie um currículo para ver seu match.",
    error: "Não foi possível calcular o match.",
    retry: "Tentar de novo",
  },
  explain: {
    a11y: "Como calculamos",
    title: "Como calculamos o match",
    keyword: "Palavras-chave — habilidades da vaga presentes no seu currículo.",
    requirements: "Requisitos — anos, idiomas e certificações pedidos vs. os seus.",
    semantic: "Semântica — proximidade de sentido entre seu currículo e a descrição.",
    fit: "Perfil — alinhamento do seu perfil comportamental com o papel.",
    footnote: "Sinais sem dados suficientes são ignorados e os pesos se reequilibram.",
  },
};

export const matchEn: TranslationDict = {
  matchLabel: "Match",
  recommended: {
    title: "Recommended for you",
  },
  gate: {
    title: "Discover your ideal jobs",
    body: "Answer 25 quick questions and see how well you fit each job.",
    ctaNever: "Discover my fit",
    ctaExpired: "Revalidate my fit",
  },
  breakdown: {
    heading: "Your match for this job",
    overallLabel: "Compatibility",
    sub: {
      keyword: "Keywords",
      requirements: "Requirements",
      semantic: "Semantic",
      fit: "Profile",
    },
    gapsTitle: "Missing from your résumé",
    improveCta: "Improve my résumé",
    tailorCta: "Tailor résumé for this job",
    tailoring: "Tailoring…",
    tailorLocked: "Improve your résumé (min. 50 quality) to tailor it to the job.",
    tailorSuccess: "Résumé tailored! Check the Résumés tab.",
    tailorError: "Couldn't tailor right now. Try later.",
    noResume: "Create a résumé to see your match.",
    error: "Couldn't compute the match.",
    retry: "Try again",
  },
  explain: {
    a11y: "How we calculate it",
    title: "How we calculate the match",
    keyword: "Keywords — the job's skills found in your résumé.",
    requirements: "Requirements — years, languages and certifications asked vs. yours.",
    semantic: "Semantic — meaning-level closeness between your résumé and the description.",
    fit: "Profile — how your behavioral profile aligns with the role.",
    footnote: "Signals without enough data are skipped and the weights rebalance.",
  },
};
