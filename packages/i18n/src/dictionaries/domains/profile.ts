/**
 * Profile copy. Both locales live side by side so key parity is reviewed
 * in one place; the parity spec in apps/client enforces it.
 */

import type { TranslationDict } from "../../types";

export const profilePtBR: TranslationDict = {
  menu: {
    themeLabel: "TEMA",
    theme: {
      light: "Claro",
      dark: "Escuro",
      system: "Sistema",
      optionA11y: "Tema {label}",
    },
    closeA11y: "Fechar menu da conta",
    viewProfileOfA11y: "Ver perfil de {name}",
    viewProfile: "Ver meu perfil",
    applications: "Candidaturas",
    settings: "Configurações",
    signOut: "Sair da conta",
    signOutConfirm: {
      title: "Sair da conta?",
      description: "Você vai precisar entrar de novo para voltar.",
      confirm: "Sair",
    },
  },
  settings: {
    sections: {
      account: "CONTA",
      appearance: "APARÊNCIA",
    },
    viewProfile: "Ver meu perfil",
    applications: "Candidaturas",
    messages: "Mensagens",
  },
  header: {
    defaultName: "Você",
    changePhotoA11y: "Trocar foto de perfil",
    headlinePlaceholder: "Adicione um título profissional",
    editProfile: "Editar perfil",
    about: "Sobre",
    links: "Links",
    settingsA11y: "Abrir configurações",
    completenessA11y: "Perfil {percent}% completo",
  },
  photo: {
    title: "Foto de perfil",
    camera: "Tirar foto",
    gallery: "Escolher da galeria",
    remove: "Remover foto",
  },
  subTabs: {
    profile: "Perfil",
    resumes: "Currículos",
  },
  master: {
    onboardingRequired: "Conclua o onboarding para montar seu currículo principal.",
    viewResumeA11y: "Ver currículo",
    viewResume: "Ver currículo (CV)",
    previewHint: "Toque para ver e baixar em PDF",
  },
  rows: {
    groupLabel: "PERFIL",
    links: "LINKS",
    add: "Adicionar",
    editA11y: "Editar {label}",
    emailLabel: "E-mail",
    emailReadonly: "Gerenciado na sua conta",
    emailManageA11y: "Gerenciar e-mail nas configurações",
  },
  edit: {
    identityTitle: "Editar perfil",
    aboutTitle: "Sobre você",
    linksTitle: "Links",
    locationLabel: "Localização",
    bioPreview: "Prévia",
    headlinePlaceholderExample: "Ex.: Desenvolvedora Front-end · React & TypeScript",
    unsaved: {
      title: "Descartar alterações?",
      description: "Você tem alterações que ainda não foram salvas.",
      discard: "Descartar",
    },
    fields: {
      name: "Nome",
      headline: "Título profissional",
      bio: "Resumo profissional",
      phone: "Telefone",
      website: "Website",
      twitter: "Twitter / X",
    },
  },
  loadingA11y: "Carregando seu perfil",
  sections: {
    identity: "Identidade",
    empty: "Adicionar",
  },
  feedback: {
    saved: "Salvo",
    saveFailed: "Não foi possível salvar. Tente de novo.",
    photoSaved: "Foto atualizada",
    photoRemoved: "Foto removida",
    photoFailed: "Não foi possível atualizar a foto.",
    loadFailed: "Não foi possível carregar seu perfil.",
    retry: "Tentar de novo",
  },
  validation: {
    name: {
      required: "Informe seu nome.",
      invalid: "O nome deve ter entre 2 e 100 caracteres.",
    },
    headline: { invalid: "O título deve ter no máximo 120 caracteres." },
    bio: { invalid: "O resumo deve ter no máximo 500 caracteres." },
    location: { invalid: "A localização deve ter no máximo 100 caracteres." },
    phone: { invalid: "Telefone inválido. Use DDD + número." },
  },
};

export const profileEn: TranslationDict = {
  menu: {
    themeLabel: "THEME",
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
      optionA11y: "{label} theme",
    },
    closeA11y: "Close account menu",
    viewProfileOfA11y: "View {name}'s profile",
    viewProfile: "View my profile",
    applications: "Applications",
    settings: "Settings",
    signOut: "Sign out",
    signOutConfirm: {
      title: "Sign out?",
      description: "You'll need to sign in again to come back.",
      confirm: "Sign out",
    },
  },
  settings: {
    sections: {
      account: "ACCOUNT",
      appearance: "APPEARANCE",
    },
    viewProfile: "View my profile",
    applications: "Applications",
    messages: "Messages",
  },
  header: {
    defaultName: "You",
    changePhotoA11y: "Change profile photo",
    headlinePlaceholder: "Add a professional title",
    editProfile: "Edit profile",
    about: "About",
    links: "Links",
    settingsA11y: "Open settings",
    completenessA11y: "Profile {percent}% complete",
  },
  photo: {
    title: "Profile photo",
    camera: "Take photo",
    gallery: "Choose from library",
    remove: "Remove photo",
  },
  subTabs: {
    profile: "Profile",
    resumes: "Resumes",
  },
  master: {
    onboardingRequired: "Complete the onboarding to build your main resume.",
    viewResumeA11y: "View resume",
    viewResume: "View resume (CV)",
    previewHint: "Tap to view and download as PDF",
  },
  rows: {
    groupLabel: "PROFILE",
    links: "LINKS",
    add: "Add",
    editA11y: "Edit {label}",
    emailLabel: "Email",
    emailReadonly: "Managed in your account",
    emailManageA11y: "Manage email in settings",
  },
  edit: {
    identityTitle: "Edit profile",
    aboutTitle: "About you",
    linksTitle: "Links",
    locationLabel: "Location",
    bioPreview: "Preview",
    headlinePlaceholderExample: "e.g. Front-end Developer · React & TypeScript",
    unsaved: {
      title: "Discard changes?",
      description: "You have changes that haven't been saved yet.",
      discard: "Discard",
    },
    fields: {
      name: "Name",
      headline: "Professional title",
      bio: "Professional summary",
      phone: "Phone",
      website: "Website",
      twitter: "Twitter / X",
    },
  },
  loadingA11y: "Loading your profile",
  sections: {
    identity: "Identity",
    empty: "Add",
  },
  feedback: {
    saved: "Saved",
    saveFailed: "Couldn't save. Please try again.",
    photoSaved: "Photo updated",
    photoRemoved: "Photo removed",
    photoFailed: "Couldn't update the photo.",
    loadFailed: "Couldn't load your profile.",
    retry: "Try again",
  },
  validation: {
    name: {
      required: "Enter your name.",
      invalid: "Name must be 2–100 characters.",
    },
    headline: { invalid: "Title must be at most 120 characters." },
    bio: { invalid: "Summary must be at most 500 characters." },
    location: { invalid: "Location must be at most 100 characters." },
    phone: { invalid: "Invalid phone number. Use area code + number." },
  },
};
