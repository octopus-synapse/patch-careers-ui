/**
 * Profile fields as individually-editable "sections". Each descriptor is one
 * row in the Perfil group AND drives a focused single-field edit sheet — tap
 * "LinkedIn" and you edit only LinkedIn, exactly like a resume section item.
 * Pure data (no JSX) so it is shared by the rows list and the sheet.
 */
import type { Translator } from "@patch-careers/i18n";
import type { BrandKey } from "../components/brand-glyph";

/** Profile fields the owner can read back from GET /v1/users/profile. */
export type EditableProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  twitter?: string | null;
};

export type ProfileFieldKey =
  | "name"
  | "headline"
  | "location"
  | "bio"
  | "linkedin"
  | "github"
  | "website"
  | "twitter";

export type ProfileFieldKind = "text" | "textarea" | "url" | "location";
export type ProfileFieldGroup = "profile" | "links";

export type ProfileFieldDescriptor = {
  key: ProfileFieldKey;
  group: ProfileFieldGroup;
  kind: ProfileFieldKind;
  label: string;
  required?: boolean;
  /** Set for social links → the row shows a brand glyph instead of an icon. */
  brand?: BrandKey;
};

export function profileFields(t: Translator): ProfileFieldDescriptor[] {
  return [
    {
      key: "name",
      group: "profile",
      kind: "text",
      label: t("profile.edit.fields.name"),
      required: true,
    },
    { key: "headline", group: "profile", kind: "text", label: t("profile.edit.fields.headline") },
    { key: "location", group: "profile", kind: "location", label: t("profile.edit.locationLabel") },
    { key: "bio", group: "profile", kind: "textarea", label: t("profile.edit.fields.bio") },
    { key: "linkedin", group: "links", kind: "url", label: "LinkedIn", brand: "linkedin" },
    { key: "github", group: "links", kind: "url", label: "GitHub", brand: "github" },
    { key: "website", group: "links", kind: "url", label: t("profile.edit.fields.website") },
  ];
}
