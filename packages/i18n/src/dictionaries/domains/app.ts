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
    notifications: "Notificações",
    notificationsUnread: "Notificações, {count} não lidas",
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
    notifications: "Notifications",
    notificationsUnread: "Notifications, {count} unread",
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
  verifyEmail: {
    testCodeSent: "Code sent (test): {code}",
  },
};
