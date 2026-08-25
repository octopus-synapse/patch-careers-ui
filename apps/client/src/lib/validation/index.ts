/**
 * Client-side validation — one source for rules, messages and the
 * backend `fields[]` bridge. See each module's header.
 */

export type { BackendFieldError } from "./backend-fields";
export { fieldErrorsFromResponse, fieldKeyOf } from "./backend-fields";
export type { GenericFieldRule } from "./generic-field";
export { genericFieldIssue, validateGenericField } from "./generic-field";
export { validationKeyFor, validationMessage } from "./messages";
export {
  hasProfileFieldRule,
  isProfileFieldRequired,
  PROFILE_FIELD_RULES,
  profileFieldIssue,
  profileFieldMaxLength,
  validateProfileField,
} from "./profile-fields";
export type { PasswordRule, ValidationIssue } from "./rules";
export { NAME_RULE, PASSWORD_POLICY, PASSWORD_RULES, USERNAME_RULE } from "./rules";
export {
  messageOf,
  validateEmail,
  validateLength,
  validateName,
  validatePassword,
  validateRequired,
  validateUsername,
} from "./validators";
