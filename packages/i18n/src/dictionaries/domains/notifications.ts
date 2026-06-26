/**
 * Notifications copy — the in-app inbox tab, the foreground toast titles, the
 * push-permission soft pre-prompt and the Expo-Go dev trigger. Both locales
 * live side by side so key parity is reviewed in one place; the parity spec in
 * apps/client enforces it.
 *
 * Note: the per-type channel toggles in Settings live under `settings.notifications.*`
 * (a separate surface) and are intentionally not duplicated here.
 */

import type { TranslationDict } from "../../types";

export const notificationsPtBR: TranslationDict = {
  title: "Notificações",
  markAllRead: "Marcar todas como lidas",
  inbox: {
    rowLabel: "Notificação: {message}",
    emptyTitle: "Nenhuma notificação ainda",
    emptyDescription: "Quando algo acontecer por aqui, você verá nesta lista.",
    errorTitle: "Não foi possível carregar suas notificações",
    errorDescription: "Verifique sua conexão e tente novamente.",
  },
  sections: {
    today: "Hoje",
    thisWeek: "Esta semana",
    earlier: "Antes",
  },
  timeAgo: {
    now: "agora",
    minutes: "{n}m",
    hours: "{n}h",
    days: "{n}d",
  },
  toast: {
    newMessage: "Nova mensagem",
    jobMatch: "Vaga compatível nova",
  },
  preprompt: {
    title: "Fique por dentro",
    body: "Ative as notificações para saber na hora de novas mensagens e vagas compatíveis com você.",
    enable: "Ativar notificações",
    notNow: "Agora não",
  },
  dev: {
    sectionTitle: "Desenvolvimento",
    hint: "Simular notificações (apenas Expo Go).",
    simulateMessage: "Simular nova mensagem",
    simulateMatch: "Simular vaga compatível",
    simulateResumeUp: "Simular currículo melhorou",
    simulateResumeDown: "Simular currículo piorou",
    sim: {
      messageTitle: "Nova mensagem",
      messageBody: "Ana enviou uma mensagem para você.",
      matchTitle: "Vaga compatível nova",
      matchBody: "Encontramos uma vaga que combina com seu perfil.",
      resumeUpTitle: "Currículo melhorou",
      resumeUpBody: "A qualidade do seu currículo aumentou.",
      resumeDownTitle: "Currículo piorou",
      resumeDownBody: "A qualidade do seu currículo caiu.",
    },
  },
};

export const notificationsEn: TranslationDict = {
  title: "Notifications",
  markAllRead: "Mark all as read",
  inbox: {
    rowLabel: "Notification: {message}",
    emptyTitle: "No notifications yet",
    emptyDescription: "When something happens here, you'll see it in this list.",
    errorTitle: "Couldn't load your notifications",
    errorDescription: "Check your connection and try again.",
  },
  sections: {
    today: "Today",
    thisWeek: "This week",
    earlier: "Earlier",
  },
  timeAgo: {
    now: "now",
    minutes: "{n}m",
    hours: "{n}h",
    days: "{n}d",
  },
  toast: {
    newMessage: "New message",
    jobMatch: "New matching job",
  },
  preprompt: {
    title: "Stay in the loop",
    body: "Turn on notifications to know right away about new messages and jobs that match you.",
    enable: "Enable notifications",
    notNow: "Not now",
  },
  dev: {
    sectionTitle: "Development",
    hint: "Simulate notifications (Expo Go only).",
    simulateMessage: "Simulate new message",
    simulateMatch: "Simulate matching job",
    simulateResumeUp: "Simulate resume improved",
    simulateResumeDown: "Simulate resume regressed",
    sim: {
      messageTitle: "New message",
      messageBody: "Ana sent you a message.",
      matchTitle: "New matching job",
      matchBody: "We found a job that fits your profile.",
      resumeUpTitle: "Resume improved",
      resumeUpBody: "Your resume quality score went up.",
      resumeDownTitle: "Resume regressed",
      resumeDownBody: "Your resume quality score dropped.",
    },
  },
};
