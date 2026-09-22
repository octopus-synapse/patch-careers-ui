/**
 * Search copy. Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const searchPtBR: TranslationDict = {
  openA11y: "Abrir busca",
  closeA11y: "Fechar busca",
  clearA11y: "Limpar busca",
  placeholder: "Buscar pessoas ou vagas…",
  navPlaceholder: "Buscar pessoas ou vagas…",
  shortcutKbd: "⌘K",
  noResults: "Nenhum resultado para “{term}”",
  noResultsHint: "Tente outro termo — pessoas ou vagas.",
  recents: "Buscas recentes",
  noRecents: "Nenhuma busca recente",
  explore: "Explorar",
  shortcuts: {
    jobs: "Ver vagas",
    messages: "Mensagens",
    profile: "Meu perfil",
  },
};

export const searchEn: TranslationDict = {
  openA11y: "Open search",
  closeA11y: "Close search",
  clearA11y: "Clear search",
  placeholder: "Search people or jobs…",
  navPlaceholder: "Search people or jobs…",
  shortcutKbd: "⌘K",
  noResults: "No results for “{term}”",
  noResultsHint: "Try another term — people or jobs.",
  recents: "Recent searches",
  noRecents: "No recent searches",
  explore: "Explore",
  shortcuts: {
    jobs: "View jobs",
    messages: "Messages",
    profile: "My profile",
  },
};
