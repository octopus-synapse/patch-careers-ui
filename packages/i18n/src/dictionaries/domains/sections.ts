/**
 * Sections copy. Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const sectionsPtBR: TranslationDict = {
  addToResume: "Adicionar ao perfil",
  back: "Voltar",
  loadError: "Não foi possível carregar as seções do currículo.",
  atCapacity: "Limite de itens atingido",
  // An empty end date is not missing data — it means the entry is current.
  present: "Presente",
  item: {
    editA11y: "Editar {title}",
    deleteA11y: "Excluir {title}",
    handWritten: "escrito por você",
    stale: "desatualizado",
    untranslated: "no idioma original",
  },
  rewrite: {
    title: "E a versão em {locale}?",
    intro:
      "Você mudou este item. Assim ficaria a versão no outro idioma — aceite, recuse ou reescreva cada mudança.",
    accept: "Aceitar",
    refuse: "Recusar",
    keep: "Manter como está",
    apply: "Aplicar",
    editA11y: "Editar a reescrita de {field}",
    localePt: "português",
    localeEn: "inglês",
    skipped: "Item salvo. A tradução para o outro idioma não está disponível agora.",
    useOriginalLanguage:
      "A tradução está indisponível. Mude para o idioma original do currículo para adicionar este item.",
  },
  links: {
    kindPickerTitle: "Tipo de link",
    urlLabel: "Endereço (URL)",
    urlPlaceholder: "https://...",
    labelLabel: "Nome",
    labelPlaceholder: "Como mostrar o link",
    addCustomTitle: "Adicionar link",
    kinds: {
      LINKEDIN: "LinkedIn",
      GITHUB: "GitHub",
      WEBSITE: "Site",
      PORTFOLIO: "Portfólio",
      CUSTOM: "Outro link",
    },
  },
  deleteConfirm: {
    title: "Excluir item?",
    description: "Essa ação não pode ser desfeita. O item sai do seu currículo na hora.",
  },
  errors: {
    noResume: "Sem currículo para editar",
  },
};

export const sectionsEn: TranslationDict = {
  addToResume: "Add to profile",
  back: "Back",
  loadError: "Could not load the resume sections.",
  atCapacity: "Item limit reached",
  present: "Present",
  item: {
    editA11y: "Edit {title}",
    deleteA11y: "Delete {title}",
    handWritten: "written by you",
    stale: "out of date",
    untranslated: "in the original language",
  },
  rewrite: {
    title: "And the {locale} version?",
    intro:
      "You changed this item. This is what the other language's version would become — accept, refuse or rewrite each change.",
    accept: "Accept",
    refuse: "Refuse",
    keep: "Keep as is",
    apply: "Apply",
    editA11y: "Edit the rewrite of {field}",
    localePt: "Portuguese",
    localeEn: "English",
    skipped: "Item saved. Translation into the other language is unavailable right now.",
    useOriginalLanguage:
      "Translation is unavailable. Switch to the resume's original language to add this item.",
  },
  links: {
    kindPickerTitle: "Link type",
    urlLabel: "URL",
    urlPlaceholder: "https://...",
    labelLabel: "Label",
    labelPlaceholder: "How to show the link",
    addCustomTitle: "Add link",
    kinds: {
      LINKEDIN: "LinkedIn",
      GITHUB: "GitHub",
      WEBSITE: "Website",
      PORTFOLIO: "Portfolio",
      CUSTOM: "Other link",
    },
  },
  deleteConfirm: {
    title: "Delete item?",
    description: "This can't be undone. The item leaves your resume immediately.",
  },
  errors: {
    noResume: "No resume to edit",
  },
};
