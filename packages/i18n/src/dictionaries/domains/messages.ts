/**
 * Messages copy. Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const messagesPtBR: TranslationDict = {
  title: "Mensagens",
  userFallback: "Usuário",
  search: {
    placeholder: "Buscar pessoas…",
    clear: "Limpar busca",
    noResults: "Nenhuma pessoa encontrada",
    resultLabel: "Conversar com {name}",
  },
  inbox: {
    rowLabel: "Conversa com {name}",
    noMessagesYet: "Sem mensagens ainda",
    emptyTitle: "Nenhuma conversa ainda",
    emptyDescription: "Busque uma pessoa acima para iniciar uma conversa.",
    errorTitle: "Não foi possível carregar suas conversas",
    errorDescription: "Verifique sua conexão e tente novamente.",
  },
  thread: {
    fallbackTitle: "Conversa",
    loadError: "Não foi possível carregar as mensagens.",
    sayHello: "Diga olá para {name}.",
    emptyHint: "Envie uma mensagem para começar a conversa.",
  },
  composer: {
    placeholder: "Escreva uma mensagem…",
    send: "Enviar mensagem",
  },
  bubble: {
    read: "Lida",
    sent: "Enviada",
  },
  timeAgo: {
    now: "agora",
    minutes: "{n}m",
    hours: "{n}h",
    days: "{n}d",
  },
};

export const messagesEn: TranslationDict = {
  title: "Messages",
  userFallback: "User",
  search: {
    placeholder: "Search people…",
    clear: "Clear search",
    noResults: "No people found",
    resultLabel: "Chat with {name}",
  },
  inbox: {
    rowLabel: "Conversation with {name}",
    noMessagesYet: "No messages yet",
    emptyTitle: "No conversations yet",
    emptyDescription: "Search for someone above to start a conversation.",
    errorTitle: "Couldn't load your conversations",
    errorDescription: "Check your connection and try again.",
  },
  thread: {
    fallbackTitle: "Conversation",
    loadError: "Couldn't load the messages.",
    sayHello: "Say hello to {name}.",
    emptyHint: "Send a message to start the conversation.",
  },
  composer: {
    placeholder: "Write a message…",
    send: "Send message",
  },
  bubble: {
    read: "Read",
    sent: "Sent",
  },
  timeAgo: {
    now: "now",
    minutes: "{n}m",
    hours: "{n}h",
    days: "{n}d",
  },
};
