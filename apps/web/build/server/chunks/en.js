const common = { "save": "Save", "cancel": "Cancel", "confirm": "Confirm", "back": "Back", "next": "Next", "loading": "Loading..." };
const nav = { "jobs": "Jobs", "companies": "Companies", "about": "About", "join": "Join", "getStarted": "Get Started", "theme": "Theme", "menu": "Menu", "close": "Close", "login": "Login" };
const dashboard = { "pageTitle": "Dashboard", "welcome": "Welcome, {{name}}!", "logout": "Sign out" };
const onboarding = { "pageTitle": "Onboarding", "title": "Complete your profile", "subtitle": "Let's set up your professional profile", "next": "Continue", "back": "Back", "complete": "Complete", "completing": "Completing...", "addItem": "Add", "removeItem": "Remove", "noData": "Nothing added yet", "modalTitle": "Add item", "modalSave": "Save", "progress": "{{value}}% complete", "skip": "Skip this step" };
const auth = { "shared": { "email": "Email Address", "errorInvalidCredentials": "Invalid email or password.", "emailPlaceholder": "jane@example.com", "password": "Password", "passwordPlaceholder": "••••••••", "fullName": "Full Name", "fullNamePlaceholder": "Jane Doe", "errorGeneric": "Something went wrong.", "errorEmailInUse": "This email is already registered.", "errorPasswordTooShort": "Password must be at least 8 characters." }, "sign-up": { "title": "Create account", "subtitle": "Enter your details to continue", "submit": "Sign Up", "submitting": "Creating account...", "footer": "Already have an account?", "footerLink": "Login", "pageTitle": "Sign up" }, "sign-in": { "title": "Welcome back", "subtitle": "Sign in to your account", "submit": "Sign In", "submitting": "Signing in...", "forgotPassword": "Forgot password?", "footer": "Don't have an account?", "footerLink": "Sign up", "pageTitle": "Sign in" } };
const en = {
  common,
  nav,
  dashboard,
  onboarding,
  auth
};
export {
  auth,
  common,
  dashboard,
  en as default,
  nav,
  onboarding
};
