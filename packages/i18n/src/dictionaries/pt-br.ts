import type { TranslationDict } from "../types";
import { appPtBR } from "./domains/app";
import { fitPtBR } from "./domains/fit";
import { jobsPtBR } from "./domains/jobs";
import { matchPtBR } from "./domains/match";
import { messagesPtBR } from "./domains/messages";
import { notificationsPtBR } from "./domains/notifications";
import { profilePtBR } from "./domains/profile";
import { resumesPtBR } from "./domains/resumes";
import { searchPtBR } from "./domains/search";
import { sectionsPtBR } from "./domains/sections";
import { settingsPtBR } from "./domains/settings";

/**
 * pt-BR dictionary. Feature copy lives in per-domain fragments under
 * `./domains/` (one file per feature, both locales side by side); the
 * groups inlined here predate that split.
 */
export const ptBR: TranslationDict = {
  app: appPtBR,
  fit: fitPtBR,
  jobs: jobsPtBR,
  match: matchPtBR,
  messages: messagesPtBR,
  notifications: notificationsPtBR,
  profile: profilePtBR,
  resumes: resumesPtBR,
  search: searchPtBR,
  sections: sectionsPtBR,
  settings: settingsPtBR,
  tabs: {
    jobs: "Vagas",
    messages: "Mensagens",
    // "Candidaturas" is no longer a tab — it's a scope inside Vagas — but the
    // label is reused there (see jobs.scope.applications).
    applications: "Candidaturas",
    resumes: "Currículos",
    profile: "Perfil",
    // Desktop-web navbar only — the account tab (LinkedIn's "Me"); the mobile
    // bottom bar keeps "Perfil".
    me: "Eu",
  },
  common: {
    hello: "Olá",
    loading: "Carregando…",
    error: "Erro",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    confirm: "Confirmar",
    retry: "Tentar novamente",
    welcome: "Bem-vindo, {name}!",
    back: "Voltar",
    submit: "Enviar",
    continue: "Continuar",
  },
  auth: {
    signIn: "Entrar",
    signOut: "Sair",
    signUp: "Criar conta",
    signInTitle: "Entre na sua conta",
    signUpTitle: "Crie sua conta",
    fullName: "Nome completo",
    fullNamePlaceholder: "Seu nome",
    email: "E-mail",
    emailPlaceholder: "voce@exemplo.com",
    password: "Senha",
    passwordPlaceholder: "Sua senha",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    forgotPassword: "Esqueci minha senha",
    noAccount: "Não tem conta?",
    haveAccount: "Já tem conta?",
    createOne: "Criar conta",
    signInInstead: "Fazer login",
    continueWith: "Continuar com {provider}",
    orDivider: "ou",
    rememberMe: "Lembrar de mim",
    keepSignedIn: "Continuar conectado",
    consentIntro: "Li e aceito os",
    consentAnd: "e a",
    consentTerms: "Termos de Uso",
    consentPrivacy: "Política de Privacidade",
    consentRequired: "Você precisa aceitar para continuar",
    forgotTitle: "Esqueceu sua senha?",
    forgotIntro: "Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.",
    forgotSuccess: "Se houver uma conta com esse e-mail, enviamos um link com instruções.",
    resetTitle: "Defina uma nova senha",
    resetNewPassword: "Nova senha",
    resetConfirmPassword: "Confirme a nova senha",
    resetMismatch: "As senhas não coincidem",
    resetSuccess: "Senha atualizada. Faça login para continuar.",
    resetInvalidToken: "Link inválido ou expirado. Solicite um novo.",
    verifyTitle: "Verifique seu e-mail",
    verifyIntro: "Digite o código de 6 dígitos enviado para {email}.",
    verifyIntroShort: "Enviamos um código de 6 dígitos para",
    verifyChangeEmail: "Usar outro e-mail",
    verifyChecking: "Verificando…",
    verifyCodeResent: "Novo código enviado.",
    verifyNotReceived: "Não recebeu?",
    verifyResendPrefix: "Reenviar em",
    verifyCodeLabel: "Código de verificação",
    verifyResend: "Reenviar código",
    verifyResendIn: "Reenviar em {seconds}s",
    verifySuccess: "E-mail verificado!",
    verifiedTitle: "E-mail verificado.",
    verifyInvalidToken: "Código inválido ou expirado. Solicite um novo.",
    twoFaTitle: "Verificação em duas etapas",
    twoFaIntro: "Digite o código do seu app autenticador.",
    twoFaUseBackup: "Usar código de backup",
    twoFaUseTotp: "Usar código do autenticador",
    twoFaBackupTitle: "Código de backup",
    twoFaBackupIntro: "Digite um dos códigos de backup gerados quando você ativou 2FA.",
    twoFaBackupPlaceholder: "Código de backup",
    oauthFinishing: "Finalizando login…",
    oauthFailed: "Falha ao concluir login. Tente novamente.",
    loginFailed: "Não foi possível entrar. Verifique e-mail e senha.",
    signupFailed: "Não foi possível criar a conta.",
    invalidEmail: "E-mail inválido",
    legalTerms: "Termos de Uso",
    legalPrivacy: "Política de Privacidade",
    validation: {
      nameRequired: "Informe seu nome",
      emailRequired: "Informe seu e-mail",
      emailInvalid: "E-mail inválido",
      passwordRequired: "Informe sua senha",
      passwordTooShort: "A senha deve ter pelo menos 8 caracteres",
      passwordTooLong: "A senha deve ter no máximo 128 caracteres",
      passwordNeedsUppercase: "Inclua ao menos uma letra maiúscula",
      passwordNeedsLowercase: "Inclua ao menos uma letra minúscula",
      passwordNeedsDigit: "Inclua ao menos um número",
      passwordNeedsSymbol: "Inclua ao menos um símbolo (@$!%*?&)",
      passwordWeak: "A senha não atende aos requisitos de segurança",
    },
    passwordStrength: {
      weak: "Fraca",
      fair: "Razoável",
      good: "Boa",
      strong: "Forte",
      hintChars: "8+ caracteres",
      hintCase: "Aa",
      hintDigit: "0-9",
      hintSymbol: "Símbolo",
    },
  },
  onboarding: {
    pageTitle: "Onboarding",
    title: "Complete seu perfil",
    next: "Continuar",
    back: "Voltar",
    complete: "Concluir",
    skipCta: "Pular",
    addItem: "Adicionar",
    editItem: "Editar",
    removeItem: "Remover",
    addSection: "Adicionar seção",
    noData: "Nada adicionado ainda",
    loadFailed: "Não foi possível carregar seu onboarding.",
    completeFailed: "Não foi possível concluir o onboarding.",
    saveFailed: "Falha de conexão. Toque para tentar de novo.",
    missingRequired: "Complete as etapas obrigatórias antes de concluir.",
    fixBeforeComplete: "Revise os campos destacados antes de concluir.",
    field: {
      optional: "opcional",
    },
    validation: {
      required: "Campo obrigatório",
      invalidUrl: "Informe uma URL válida",
      invalidPattern: "Formato inválido",
      minLength: "Mínimo de {count} caracteres",
      maxLength: "Máximo de {count} caracteres",
      username: "Use apenas letras minúsculas, números e _",
    },
    sectionPicker: {
      empty: "Você já adicionou todas as seções disponíveis.",
      close: "Fechar",
    },
    location: {
      title: "Selecione a localização",
      placeholder: "Selecione a localização",
      searchPlaceholder: "Buscar cidade, estado ou país…",
      hintMinChars: "Digite ao menos 2 letras para buscar.",
      hintSearching: "Buscando…",
      hintEmpty: "Nenhum resultado para “{q}”.",
    },
    institution: {
      title: "Selecione a instituição",
      placeholder: "Busque ou digite a instituição",
      searchPlaceholder: "Buscar instituições do Brasil (MEC)…",
      hintMinChars: "Digite ao menos 3 letras para buscar.",
      hintSearching: "Buscando…",
      hintEmpty: "Nenhum resultado do MEC para “{q}”.",
      useTyped: "Usar “{q}” como digitado",
    },
    course: {
      title: "Selecione o curso",
      placeholder: "Busque ou digite o curso",
      searchPlaceholder: "Buscar cursos (MEC)…",
      hintMinChars: "Digite ao menos 3 letras para buscar.",
      hintSearching: "Buscando…",
      hintEmpty: "Nenhum resultado do MEC para “{q}”.",
      hintInstitution: "Mostrando cursos de {institution} (MEC).",
      useTyped: "Usar “{q}” como digitado",
    },
    company: {
      title: "Selecione a empresa",
      placeholder: "Busque ou digite a empresa",
      searchPlaceholder: "Buscar empresas…",
      hintMinChars: "Digite ao menos 2 letras para buscar.",
      hintSearching: "Buscando…",
      hintEmpty: "Nenhum resultado para “{q}”.",
      useTyped: "Usar “{q}” como digitado",
      // Brand name + free-tier attribution requirement: stays in English.
      attribution: "Logos provided by Logo.dev",
    },
    role: {
      title: "Selecione o cargo",
      placeholder: "Busque ou digite o cargo",
      searchPlaceholder: "Buscar cargos…",
      hintMinChars: "Digite ao menos 2 letras para buscar.",
      hintSearching: "Buscando…",
      hintEmpty: "Nenhum resultado para “{q}”.",
      useTyped: "Usar “{q}” como digitado",
      internLocked: "Cargos de estágio definem o tipo como Estágio. Troque o cargo para alterar.",
    },
    language: {
      prompt: "Qual idioma você prefere?",
      // Each option is written in its own target language on purpose, so it
      // reads the same regardless of the current UI locale — both dictionaries
      // carry identical values for these keys.
      english: {
        native: "English",
        hint: "Interface, dates & content in English",
      },
      portuguese: {
        native: "Português (Brasil)",
        hint: "Interface, datas e conteúdo em português",
      },
    },
    theme: {
      light: {
        label: "Claro",
        hint: "Papel claro, tinta escura.",
      },
      dark: {
        label: "Escuro",
        hint: "Papel escuro, tinta clara.",
      },
      system: {
        label: "Automático",
        hint: "Segue a aparência do sistema.",
      },
    },
    username: {
      checking: "Verificando…",
      available: "Disponível",
      taken: "Indisponível",
      error: "Não foi possível verificar — toque para tentar",
    },
    links: {
      add: "Adicionar link",
    },
    welcome: {
      tagline:
        "Conte sua história uma vez. O Patch reescreve seu currículo para cada vaga — e faz ele chegar a quem decide.",
      timePromise: "Pronto em ~3 minutos",
      cta: "Começar",
    },
    review: {
      missingTitle: "Conclua estas etapas obrigatórias",
      fix: "Corrigir",
      items: "{count} itens",
      itemsOne: "1 item",
    },
    done: {
      title: "Seu currículo está pronto.",
      cta: "Começar",
    },
    resumeStyle: {
      use: "Usar este modelo",
      previewHint: "Toque para visualizar",
    },
    section: {
      emptyTitle: "Nada por aqui ainda",
      emptyBody: "Adicione o primeiro item.",
      noFieldsTitle: "Seção indisponível no momento",
      noFieldsBody:
        "Não foi possível carregar os campos desta seção. Você pode pular por enquanto.",
    },
    flow: {
      welcome: {
        title: "Boas-vindas",
        subtitle: "",
      },
      language: {
        title: "Escolha seu idioma",
        subtitle: "",
      },
      theme: {
        title: "Escolha seu tema",
        subtitle: "",
      },
      location: {
        title: "Onde você mora?",
        subtitle: "",
      },
      personal: {
        title: "Sobre você",
        subtitle: "",
      },
      username: {
        title: "Escolha um usuário",
        linkLabel: "Seu link público",
      },
      experience: {
        title: "Sua experiência",
        subtitle: "Adicione suas experiências.",
      },
      headline: {
        title: "Seu título profissional",
        subtitle: "",
      },
      links: {
        title: "Seus links",
        subtitle: "",
      },
      education: {
        title: "Sua formação",
        subtitle: "",
      },
      resumeStyle: {
        title: "Escolha um estilo",
        subtitle: "",
      },
      review: {
        title: "Quase lá",
        subtitle: "",
      },
    },
    date: {
      present: "Atual",
      placeholder: "Selecionar data",
      prevYear: "Ano anterior",
      nextYear: "Próximo ano",
    },
    experience: {
      statusPrompt: "Qual a sua situação atual?",
      statusEmployed: "Empregado",
      statusUnemployed: "Desempregado",
      statusStudent: "Estudante",
      statusFreelancer: "Freelancer",
      statusEntrepreneur: "Empreendedor",
      statusRetired: "Aposentado",
      hintCurrent:
        "Adicione seu emprego atual primeiro (deixe a data de término vazia) e depois experiências anteriores.",
      hintPast: "Adicione experiências anteriores, incluindo trabalho voluntário.",
    },
  },
};

export default ptBR;
