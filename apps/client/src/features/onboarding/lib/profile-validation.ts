/**
 * Onboarding's view of the profile contract — re-exported from the app-wide
 * validation module so the wizard, the Profile tab and the auth forms all
 * enforce the same rules (`@/lib/validation/profile-fields` documents why
 * `fullName`/`summary` differ from `name`/`bio`).
 */
export {
  hasProfileFieldRule,
  isProfileFieldRequired,
  validateProfileField,
} from "@/lib/validation";
