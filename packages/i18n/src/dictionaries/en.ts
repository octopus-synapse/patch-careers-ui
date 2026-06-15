import type { TranslationDict } from "../types";
import { appEn } from "./domains/app";
import { jobsEn } from "./domains/jobs";
import { messagesEn } from "./domains/messages";
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
  jobs: jobsEn,
  messages: messagesEn,
  profile: profileEn,
  resumes: resumesEn,
  search: searchEn,
  sections: sectionsEn,
  settings: settingsEn,
  tabs: {
    jobs: "Jobs",
    applications: "Applications",
    notifications: "Notifications",
    profile: "Profile",
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
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Create account",
    signInTitle: "Sign in to your account",
    signUpTitle: "Create your account",
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
    consentLine: "I have read and agree to the {terms} and the {privacy}",
    consentTerms: "Terms of Service",
    consentPrivacy: "Privacy Policy",
    consentRequired: "You must accept to continue",
    forgotTitle: "Forgot your password?",
    forgotIntro: "Enter the email for your account and we’ll send a reset link.",
    forgotSuccess: "If an account with that email exists, we sent reset instructions.",
    resetTitle: "Set a new password",
    resetNewPassword: "New password",
    resetConfirmPassword: "Confirm new password",
    resetMismatch: "Passwords don’t match",
    resetSuccess: "Password updated. Sign in to continue.",
    resetInvalidToken: "Invalid or expired link. Please request a new one.",
    verifyTitle: "Verify your email",
    verifyIntro: "Enter the 6-digit code sent to {email}.",
    verifyResend: "Resend code",
    verifyResendIn: "Resend in {seconds}s",
    verifySuccess: "Email verified!",
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
    invalidEmail: "Invalid email",
    legalTerms: "Terms of Service",
    legalPrivacy: "Privacy Policy",
    validation: {
      emailRequired: "Enter your email",
      emailInvalid: "Invalid email",
      passwordRequired: "Enter your password",
      passwordTooShort: "Password must be at least 8 characters",
      passwordTooLong: "Password must be at most 128 characters",
      passwordNeedsUppercase: "Add at least one uppercase letter",
      passwordNeedsLowercase: "Add at least one lowercase letter",
      passwordNeedsDigit: "Add at least one number",
      passwordNeedsSymbol: "Add at least one symbol (@$!%*?&)",
      passwordWeak: "Password does not meet security requirements",
    },
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
    skip: "Skip this step",
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
      required: "required",
      optional: "optional",
    },
    validation: {
      required: "Required field",
      invalidUrl: "Enter a valid URL",
      invalidPattern: "Invalid format",
      minLength: "Minimum of {count} characters",
      maxLength: "Maximum of {count} characters",
      username: "Use only lowercase letters, numbers, and _",
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
    progress: {
      timeRemaining: "~{min} min left",
      timeRemainingOne: "~{min} min left",
    },
    welcome: {
      tagline: "Build a recruiter-ready resume, optimized to pass ATS screens.",
      timePromise: "Ready in ~3 minutes",
      cta: "Get started",
    },
    review: {
      missingTitle: "Finish these required steps",
      fix: "Fix",
    },
    resume: {
      title: "You left off at {phase}",
      subtitle: "Pick up where you stopped, or start over.",
      continue: "Continue",
      restart: "Start over",
    },
    resumeStyle: {
      use: "Use this template",
      previewHint: "Tap to preview",
    },
    ats: {
      high: {
        label: "High ATS match",
        blurb: "Single column, no tables — easy for parsers to read.",
      },
      good: {
        label: "Good ATS match",
        blurb: "Clean structure that most parsers handle well.",
      },
      fair: {
        label: "Fair ATS match",
        blurb: "More styling — best for human-first applications.",
      },
    },
    section: {
      emptyTitle: "Nothing here yet",
      emptyBody: "Add your first entry — or skip and come back later.",
      noFieldsTitle: "Section unavailable right now",
      noFieldsBody: "We couldn't load this section's fields. You can skip it for now.",
    },
    flow: {
      phases: {
        identity: "Identity",
        history: "History",
        resume: "Resume",
      },
      welcome: {
        title: "Welcome",
        subtitle: "",
      },
      language: {
        title: "Choose your language",
        subtitle: "Pick the language you'd like to continue in.",
      },
      theme: {
        title: "Choose your theme",
        subtitle: "The app updates instantly — you can change it later from the account menu.",
      },
      location: {
        title: "Where are you based?",
        subtitle: "We tailor roles and formatting to your region.",
        contextLabel: "Why we ask",
        contextNote:
          "We use your city to surface roles open near you and match local salary and date formats.",
      },
      personal: {
        title: "About you",
        subtitle: "The essentials recruiters see first.",
        contextLabel: "Stays private",
        contextNote:
          "Your phone is only shared after you apply — it's never shown on your public profile.",
      },
      username: {
        title: "Pick a username",
        subtitle: "This becomes your public profile link.",
        linkLabel: "Your public link",
        linkNote: "Recruiters open this to see your profile.",
      },
      experience: {
        title: "Your experience",
        subtitle: "Add your roles — start with your most recent.",
      },
      headline: {
        title: "Your headline",
        subtitle: "A one-line pitch, plus a short bio if you like.",
      },
      links: {
        title: "Your links",
        subtitle: "LinkedIn, GitHub, portfolio — all optional.",
      },
      education: {
        title: "Your education",
        subtitle: "Degrees, bootcamps, courses — or skip it.",
      },
      resumeStyle: {
        title: "Pick a style",
        subtitle: "Choose the look of your resume. You can change it later.",
      },
      review: {
        title: "Almost there",
        subtitle: "Review everything and add any optional sections.",
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
      hintPast: "Add any past experience, including volunteer work — or skip if you have none.",
    },
  },
};

export default en;
