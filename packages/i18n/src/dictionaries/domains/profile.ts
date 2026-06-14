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
  },
  subTabs: {
    profile: "Perfil",
    resumes: "Currículos",
  },
  master: {
    onboardingRequired: "Conclua o onboarding para montar seu currículo principal.",
    viewResumeA11y: "Ver currículo",
    viewResume: "Ver currículo (CV)",
  },
  edit: {
    identityTitle: "Editar perfil",
    aboutTitle: "Sobre você",
    linksTitle: "Links",
    locationLabel: "Localização",
    fields: {
      name: "Nome",
      headline: "Título profissional",
      bio: "Sobre você",
      website: "Website",
      twitter: "Twitter / X",
    },
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
  },
  subTabs: {
    profile: "Profile",
    resumes: "Resumes",
  },
  master: {
    onboardingRequired: "Complete the onboarding to build your main resume.",
    viewResumeA11y: "View resume",
    viewResume: "View resume (CV)",
  },
  edit: {
    identityTitle: "Edit profile",
    aboutTitle: "About you",
    linksTitle: "Links",
    locationLabel: "Location",
    fields: {
      name: "Name",
      headline: "Professional title",
      bio: "About you",
      website: "Website",
      twitter: "Twitter / X",
    },
  },
};
