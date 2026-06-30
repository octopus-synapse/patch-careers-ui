/**
 * Fit Profile copy (the 25-question psychometric questionnaire that unlocks
 * the Match Score). Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const fitPtBR: TranslationDict = {
  intro: {
    title: "Descubra seu fit",
    subtitle:
      "25 perguntas rápidas sobre como você trabalha e o que importa pra você. Usamos isso pra te conectar com vagas e times onde você vai prosperar.",
    duration: "Cerca de 3 minutos",
    start: "Começar",
    notNow: "Agora não",
  },
  question: {
    progress: "{current} de {total}",
  },
  likert: {
    min: "Discordo totalmente",
    max: "Concordo totalmente",
  },
  binary: {
    no: "Não",
    yes: "Sim",
  },
  actions: {
    back: "Voltar",
    next: "Próxima",
    submit: "Ver meu fit",
    submitting: "Calculando…",
  },
  done: {
    title: "Seu fit está pronto",
    subtitle: "Montamos seu perfil. Os matches de vaga foram desbloqueados.",
    cta: "Concluir",
  },
  error: {
    loadTitle: "Não foi possível carregar o questionário",
    loadHint: "Verifique sua conexão e tente de novo.",
    submit: "Não foi possível salvar suas respostas. Tente de novo.",
    retry: "Tentar novamente",
  },
};

export const fitEn: TranslationDict = {
  intro: {
    title: "Discover your fit",
    subtitle:
      "25 quick questions about how you work and what matters to you. We use this to match you with jobs and teams where you'll thrive.",
    duration: "About 3 minutes",
    start: "Start",
    notNow: "Not now",
  },
  question: {
    progress: "{current} of {total}",
  },
  likert: {
    min: "Strongly disagree",
    max: "Strongly agree",
  },
  binary: {
    no: "No",
    yes: "Yes",
  },
  actions: {
    back: "Back",
    next: "Next",
    submit: "See my fit",
    submitting: "Calculating…",
  },
  done: {
    title: "Your fit is ready",
    subtitle: "We've built your profile. Job matches are unlocked.",
    cta: "Done",
  },
  error: {
    loadTitle: "Couldn't load the questionnaire",
    loadHint: "Check your connection and try again.",
    submit: "Couldn't save your answers. Try again.",
    retry: "Try again",
  },
};
