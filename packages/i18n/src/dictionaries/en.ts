import type { TranslationDict } from "../types";
import { appEn } from "./domains/app";
import { fitEn } from "./domains/fit";
import { jobsEn } from "./domains/jobs";
import { matchEn } from "./domains/match";
import { messagesEn } from "./domains/messages";
import { notificationsEn } from "./domains/notifications";
import { profileEn } from "./domains/profile";
import { resumesEn } from "./domains/resumes";
import { searchEn } from "./domains/search";
import { sectionsEn } from "./domains/sections";
import { settingsEn } from "./domains/settings";

/**
 * en dictionary. Feature copy lives in per-domain fragments under
 * `./domains/` (one file per feature, both locales side by side); the
 * groups inlined here predate that split.
 */
export const en: TranslationDict = {
  app: appEn,
  fit: fitEn,
  jobs: jobsEn,
  match: matchEn,
  messages: messagesEn,
  notifications: notificationsEn,
  profile: profileEn,
  resumes: resumesEn,
  search: searchEn,
  sections: sectionsEn,
  settings: settingsEn,
  tabs: {
    jobs: "Jobs",
    messages: "Messages",
    // "Applications" is no longer a tab — it's a scope inside Jobs — but the
    // label is reused there (see jobs.scope.applications).
    applications: "Applications",
    resumes: "Resumes",
    profile: "Profile",
    // Desktop-web navbar only — the account tab (LinkedIn's "Me"); the mobile
    // bottom bar keeps "Profile".
    me: "Me",
  },
  common: {
    hello: "Hello",
    loading: "Loading…",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    retry: "Try again",
    welcome: "Welcome, {name}!",
    back: "Back",
    submit: "Submit",
    continue: "Continue",
  },
  // Field-level validation — field-agnostic sentences rendered under the
  // input. Same codes/wording as the backend's VALIDATION_DICTIONARY, so a
  // local check and a server `fields[]` message read identically.
  validation: {
    required: "This field is required",
    minLength: "Minimum of {min} characters",
    maxLength: "Maximum of {max} characters",
    emailInvalid: "Enter a valid e-mail",
    invalidUrl: "Enter a valid URL",
    invalidPattern: "Invalid format",
    username: "Use only lowercase letters, numbers, and _",
    phoneInvalid: "Invalid phone number. Use area code + number.",
    passwordNeedsUppercase: "Add at least one uppercase letter",
    passwordNeedsLowercase: "Add at least one lowercase letter",
    passwordNeedsDigit: "Add at least one number",
    passwordNeedsSymbol: "Add at least one symbol ({chars})",
    passwordWeak: "Password does not meet security requirements",
    passwordMismatch: "Passwords don't match",
  },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Create account",
    signInTitle: "Sign in to your account",
    signUpTitle: "Create your account",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgotPassword: "Forgot password?",
    noAccount: "Don’t have an account?",
    haveAccount: "Already have an account?",
    createOne: "Create one",
    signInInstead: "Sign in",
    continueWith: "Continue with {provider}",
    orDivider: "or",
    rememberMe: "Remember me",
    keepSignedIn: "Keep me signed in",
    consentIntro: "I have read and agree to the",
    consentAnd: "and the",
    consentTerms: "Terms of Service",
    consentPrivacy: "Privacy Policy",
    consentDialogTitle: "Terms and privacy",
    consentDialogBody:
      "To create your account, you need to read and accept the Terms of Service and the Privacy Policy.",
    consentAccept: "Accept and create account",
    forgotTitle: "Forgot your password?",
    forgotIntro: "Enter the email for your account and we’ll send a reset link.",
    forgotSuccess: "If an account with that email exists, we sent reset instructions.",
    resetTitle: "Set a new password",
    resetNewPassword: "New password",
    resetConfirmPassword: "Confirm new password",
    resetSuccess: "Password updated. Sign in to continue.",
    resetInvalidToken: "Invalid or expired link. Please request a new one.",
    verifyTitle: "Verify your email",
    verifyIntro: "Enter the 6-digit code sent to {email}.",
    verifyIntroShort: "We sent a 6-digit code to",
    verifyChangeEmail: "Use another email",
    verifyChecking: "Verifying…",
    verifyCodeResent: "New code sent.",
    verifyNotReceived: "Didn't get it?",
    verifyResendPrefix: "Resend in",
    verifyCodeLabel: "Verification code",
    verifyResend: "Resend code",
    verifyResendIn: "Resend in {seconds}s",
    verifySuccess: "Email verified!",
    verifiedTitle: "Email verified.",
    verifyInvalidToken: "Invalid or expired code. Please request a new one.",
    twoFaTitle: "Two-factor verification",
    twoFaIntro: "Enter the code from your authenticator app.",
    twoFaUseBackup: "Use backup code",
    twoFaUseTotp: "Use authenticator code",
    twoFaBackupTitle: "Backup code",
    twoFaBackupIntro: "Enter one of the backup codes you generated when enabling 2FA.",
    twoFaBackupPlaceholder: "Backup code",
    oauthFinishing: "Finishing sign-in…",
    oauthFailed: "Could not complete sign-in. Please try again.",
    loginFailed: "Could not sign in. Check your email and password.",
    signupFailed: "Could not create the account.",
    legalTerms: "Terms of Service",
    legalPrivacy: "Privacy Policy",
    passwordStrength: {
      weak: "Weak",
      fair: "Fair",
      good: "Good",
      strong: "Strong",
      hintChars: "8+ chars",
      hintCase: "Aa",
      hintDigit: "0-9",
      hintSymbol: "Symbol",
    },
  },
  onboarding: {
    pageTitle: "Onboarding",
    title: "Complete your profile",
    next: "Continue",
    back: "Back",
    complete: "Complete",
    skipCta: "Skip",
    addItem: "Add",
    editItem: "Edit",
    removeItem: "Remove",
    addSection: "Add section",
    noData: "Nothing added yet",
    loadFailed: "Could not load your onboarding.",
    completeFailed: "Could not complete onboarding.",
    saveFailed: "Connection failed. Tap to try again.",
    missingRequired: "Complete the required steps before finishing.",
    fixBeforeComplete: "Review the highlighted fields before finishing.",
    field: {
      optional: "optional",
    },
    step: {
      optional: "Optional",
    },
    sectionPicker: {
      empty: "You've already added all the available sections.",
      close: "Close",
    },
    location: {
      title: "Select your location",
      placeholder: "Select your location",
      searchPlaceholder: "Search city, state, or country…",
      hintMinChars: "Type at least 2 letters to search.",
      hintSearching: "Searching…",
      hintEmpty: "No results for “{q}”.",
    },
    institution: {
      title: "Select your institution",
      placeholder: "Search or type your institution",
      searchPlaceholder: "Search Brazilian institutions (MEC)…",
      hintMinChars: "Type at least 3 letters to search.",
      hintSearching: "Searching…",
      hintEmpty: "No MEC results for “{q}”.",
      useTyped: "Use “{q}” as typed",
    },
    course: {
      title: "Select your course",
      placeholder: "Search or type your course",
      searchPlaceholder: "Search MEC courses…",
      hintMinChars: "Type at least 3 letters to search.",
      hintSearching: "Searching…",
      hintEmpty: "No MEC results for “{q}”.",
      hintInstitution: "Showing courses offered by {institution} (MEC).",
      useTyped: "Use “{q}” as typed",
    },
    company: {
      title: "Select a company",
      placeholder: "Search or type a company",
      searchPlaceholder: "Search companies…",
      hintMinChars: "Type at least 2 letters to search.",
      hintSearching: "Searching…",
      hintEmpty: "No results for “{q}”.",
      useTyped: "Use “{q}” as typed",
      attribution: "Logos provided by Logo.dev",
    },
    role: {
      title: "Select a role",
      placeholder: "Search or type your role",
      searchPlaceholder: "Search job titles…",
      hintMinChars: "Type at least 2 letters to search.",
      hintSearching: "Searching…",
      hintEmpty: "No results for “{q}”.",
      useTyped: "Use “{q}” as typed",
      internLocked: "Internship roles set the type to Internship. Change the role to edit it.",
    },
    language: {
      prompt: "Which language do you prefer?",
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
        label: "Light",
        hint: "Light paper, dark ink.",
      },
      dark: {
        label: "Dark",
        hint: "Dark paper, light ink.",
      },
      system: {
        label: "Automatic",
        hint: "Follows your system appearance.",
      },
    },
    username: {
      checking: "Checking…",
      available: "Available",
      taken: "Taken",
      error: "Couldn't check — tap to retry",
    },
    links: {
      add: "Add link",
    },
    welcome: {
      tagline:
        "Tell your story once. Patch rewrites your resume for every job — and gets it in front of the people who decide.",
      timePromise: "Ready in ~3 minutes",
      cta: "Get started",
    },
    review: {
      missingTitle: "Finish these required steps",
      fix: "Fix",
      items: "{count} items",
      itemsOne: "1 item",
    },
    done: {
      title: "Your resume is ready.",
      cta: "Get started",
    },
    resumeStyle: {
      use: "Use this template",
      previewHint: "Tap to preview",
    },
    section: {
      emptyTitle: "Nothing here yet",
      emptyBody: "Add your first entry.",
      noFieldsTitle: "Section unavailable right now",
      noFieldsBody: "We couldn't load this section's fields. You can skip it for now.",
    },
    flow: {
      welcome: {
        title: "Welcome",
        subtitle: "",
      },
      language: {
        title: "Choose your language",
        subtitle: "",
      },
      theme: {
        title: "Choose your theme",
        subtitle: "",
      },
      location: {
        title: "Where are you based?",
        subtitle: "",
      },
      personal: {
        title: "About you",
        subtitle: "",
      },
      username: {
        title: "Pick a username",
        linkLabel: "Your public link",
      },
      experience: {
        title: "Your experience",
        subtitle: "Add your roles.",
      },
      headline: {
        title: "Your headline",
        subtitle: "",
      },
      links: {
        title: "Your links",
        subtitle: "",
      },
      education: {
        title: "Your education",
        subtitle: "",
      },
      resumeStyle: {
        title: "Pick a style",
        subtitle: "",
      },
      review: {
        title: "Almost there",
        subtitle: "",
      },
    },
    date: {
      present: "Present",
      placeholder: "Select date",
      prevYear: "Previous year",
      nextYear: "Next year",
    },
    experience: {
      statusPrompt: "What's your current situation?",
      statusEmployed: "Employed",
      statusUnemployed: "Unemployed",
      statusStudent: "Student",
      statusFreelancer: "Freelancer",
      statusEntrepreneur: "Entrepreneur",
      statusRetired: "Retired",
      hintCurrent: "Add your current job first (leave the end date empty), then any past roles.",
      hintPast: "Add any past experience, including volunteer work.",
    },
  },
};

export default en;
