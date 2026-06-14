/**
 * App copy. Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const appPtBR: TranslationDict = {
  header: {
    you: "Você",
    openAccountMenu: "Abrir menu da conta",
    messages: "Mensagens",
    messagesUnread: "Mensagens, {count} não lidas",
  },
  netInfoBanner: {
    offline: "Erro — offline",
  },
  placeholderScreen: {
    subtitle: "Placeholder da aba",
  },
  confirmDialog: {
    close: "Fechar",
  },
  signIn: {
    heroPrefix: "Bem-vindo de ",
    heroEmphasis: "volta.",
    subtitle: "Entre para continuar sua busca.",
  },
  signUp: {
    heroPrefix: "Crie sua ",
    heroEmphasis: "conta.",
    subtitle: "Alguns detalhes para você entrar.",
  },
  verifyEmail: {
    testCodeSent: "Codigo enviado (teste): {code}",
  },
};

export const appEn: TranslationDict = {
  header: {
    you: "You",
    openAccountMenu: "Open account menu",
    messages: "Messages",
    messagesUnread: "Messages, {count} unread",
  },
  netInfoBanner: {
    offline: "Error — offline",
  },
  placeholderScreen: {
    subtitle: "Tab placeholder",
  },
  confirmDialog: {
    close: "Close",
  },
  signIn: {
    heroPrefix: "Welcome ",
    heroEmphasis: "back.",
    subtitle: "Sign in to continue your search.",
  },
  signUp: {
    heroPrefix: "Create your ",
    heroEmphasis: "account.",
    subtitle: "A few details to get you in the door.",
  },
  verifyEmail: {
    testCodeSent: "Code sent (test): {code}",
  },
};
