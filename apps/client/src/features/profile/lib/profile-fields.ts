/**
 * Identity fields as individually-editable rows. Each descriptor is one row in
 * the "Perfil" supersection AND drives a focused single-field edit sheet — tap
 * "Telefone" and you edit only the phone, exactly like a resume section item.
 * Pure data (no JSX) so it is shared by the rows list and the sheet.
 *
 * Links are NO LONGER here — they're a real resume section (links_v1), edited
 * through the section manager. These stay User-backed (PATCH /v1/users/profile)
 * because they're typed/validated columns used across the app.
 */
import type { Translator } from "@patch-careers/i18n";

/** Profile fields the owner can read back from GET /v1/users/profile. */
export type EditableProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  phone?: string | null;
  /** Read-only here — shown in the identity card, never editable inline. */
  email?: string | null;
};

export type ProfileFieldKey = "name" | "headline" | "location" | "bio" | "phone";

export type ProfileFieldKind = "text" | "textarea" | "location" | "phone";

export type ProfileFieldDescriptor = {
  key: ProfileFieldKey;
  kind: ProfileFieldKind;
  label: string;
};

export function profileFields(t: Translator): ProfileFieldDescriptor[] {
  return [
    { key: "name", kind: "text", label: t("profile.edit.fields.name") },
    { key: "headline", kind: "text", label: t("profile.edit.fields.headline") },
    { key: "location", kind: "location", label: t("profile.edit.locationLabel") },
    { key: "bio", kind: "textarea", label: t("profile.edit.fields.bio") },
    { key: "phone", kind: "phone", label: t("profile.edit.fields.phone") },
  ];
}
