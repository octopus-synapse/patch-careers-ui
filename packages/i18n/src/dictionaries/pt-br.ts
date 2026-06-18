import type { TranslationDict } from "../types";
import { appPtBR } from "./domains/app";
import { jobsPtBR } from "./domains/jobs";
import { messagesPtBR } from "./domains/messages";
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
  jobs: jobsPtBR,
  messages: messagesPtBR,
  profile: profilePtBR,
  resumes: resumesPtBR,
  search: searchPtBR,
  sections: sectionsPtBR,
  settings: settingsPtBR,
  tabs: {
    jobs: "Vagas",
    applications: "Candidaturas",
    notifications: "Notificações",
    profile: "Perfil",
    // Short variants for the bottom tab bar (4 small-caps labels, tight fit).
    applicationsShort: "Candid.",
    notificationsShort: "Notif.",
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
    consentLine: "Li e aceito os {terms} e a {privacy}",
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
    verifyResend: "Reenviar código",
    verifyResendIn: "Reenviar em {seconds}s",
    verifySuccess: "E-mail verificado!",
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
    skip: "Pular esta etapa",
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
      required: "obrigatório",
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
    progress: {
      timeRemaining: "~{min} min restantes",
      timeRemainingOne: "~{min} min restante",
    },
    welcome: {
      tagline:
        "Monte um currículo pronto para recrutadores, otimizado para passar pelos filtros ATS.",
      timePromise: "Pronto em ~3 minutos",
      cta: "Começar",
    },
    review: {
      missingTitle: "Conclua estas etapas obrigatórias",
      fix: "Corrigir",
    },
    resume: {
      title: "Você parou em {phase}",
      subtitle: "Continue de onde parou, ou recomece.",
      continue: "Continuar",
      restart: "Recomeçar",
    },
    resumeStyle: {
      use: "Usar este modelo",
      previewHint: "Toque para visualizar",
    },
    ats: {
      high: {
        label: "Alta compatibilidade ATS",
        blurb: "Coluna única, sem tabelas — fácil de ler pelos robôs.",
      },
      good: {
        label: "Boa compatibilidade ATS",
        blurb: "Estrutura limpa que a maioria dos robôs lê bem.",
      },
      fair: {
        label: "Compatibilidade ATS média",
        blurb: "Mais estilizado — melhor para candidaturas avaliadas por pessoas.",
      },
    },
    section: {
      emptyTitle: "Nada por aqui ainda",
      emptyBody: "Adicione o primeiro item — ou pule e volte depois.",
      noFieldsTitle: "Seção indisponível no momento",
      noFieldsBody:
        "Não foi possível carregar os campos desta seção. Você pode pular por enquanto.",
    },
    flow: {
      phases: {
        identity: "Identidade",
        history: "Histórico",
        resume: "Currículo",
      },
      welcome: {
        title: "Boas-vindas",
        subtitle: "",
      },
      language: {
        title: "Escolha seu idioma",
        subtitle: "Selecione o idioma para continuar.",
      },
      theme: {
        title: "Escolha seu tema",
        subtitle: "O app muda na hora — dá pra trocar depois no menu da conta.",
      },
      location: {
        title: "Onde você mora?",
        subtitle: "Ajustamos vagas e formatação à sua região.",
        contextLabel: "Por que pedimos",
        contextNote:
          "Usamos sua cidade para mostrar vagas perto de você e ajustar formatos locais de salário e data.",
      },
      personal: {
        title: "Sobre você",
        subtitle: "O essencial que os recrutadores veem primeiro.",
        contextLabel: "Fica privado",
        contextNote:
          "Seu telefone só é compartilhado quando você se candidata — nunca aparece no perfil público.",
      },
      username: {
        title: "Escolha um usuário",
        subtitle: "Vira o link público do seu perfil.",
        linkLabel: "Seu link público",
        linkNote: "Recrutadores abrem isto para ver seu perfil.",
      },
      experience: {
        title: "Sua experiência",
        subtitle: "Adicione suas experiências — comece pela mais recente.",
      },
      headline: {
        title: "Sua headline",
        subtitle: "Uma frase de impacto e, se quiser, uma bio curta.",
      },
      links: {
        title: "Seus links",
        subtitle: "LinkedIn, GitHub, portfólio — todos opcionais.",
      },
      education: {
        title: "Sua formação",
        subtitle: "Graduações, cursos, bootcamps — ou pule.",
      },
      resumeStyle: {
        title: "Escolha um estilo",
        subtitle: "Defina o visual do currículo. Dá pra mudar depois.",
      },
      review: {
        title: "Quase lá",
        subtitle: "Revise tudo e adicione seções opcionais.",
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
      hintPast:
        "Adicione experiências anteriores, incluindo trabalho voluntário — ou pule se não tiver nenhuma.",
    },
  },
};

export default ptBR;
