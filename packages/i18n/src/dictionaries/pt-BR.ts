import type { TranslationDict } from "../types";

/**
 * Placeholder pt-BR dictionary. PR #5 (api-client) ships a typed
 * generated dictionary that supersedes this file.
 */
export const ptBR: TranslationDict = {
  common: {
    hello: "Olá",
    loading: "Carregando…",
    error: "Erro",
    save: "Salvar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    retry: "Tentar novamente",
    welcome: "Bem-vindo, {name}!",
  },
  auth: {
    signIn: "Entrar",
    signOut: "Sair",
  },
};

export default ptBR;
