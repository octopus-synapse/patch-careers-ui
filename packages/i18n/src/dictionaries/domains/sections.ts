/**
 * Sections copy. Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const sectionsPtBR: TranslationDict = {
  addToResume: "Adicionar ao currículo",
  back: "Voltar",
  loadError: "Não foi possível carregar as seções do currículo.",
  atCapacity: "Limite de itens atingido",
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
  validation: {
    required: "Campo obrigatório",
    invalidUrl: "Informe uma URL válida",
    invalidPattern: "Formato inválido",
    minLength: "Mínimo de {count} caracteres",
    maxLength: "Máximo de {count} caracteres",
  },
};

export const sectionsEn: TranslationDict = {
  addToResume: "Add to resume",
  back: "Back",
  loadError: "Could not load the resume sections.",
  atCapacity: "Item limit reached",
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
  validation: {
    required: "Required field",
    invalidUrl: "Enter a valid URL",
    invalidPattern: "Invalid format",
    minLength: "Minimum of {count} characters",
    maxLength: "Maximum of {count} characters",
  },
};
