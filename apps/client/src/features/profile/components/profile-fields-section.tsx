/**
 * "Perfil" group — every profile field (name, headline, location, bio) and
 * every social link is its own tappable EditableRow that opens a focused
 * single-field sheet, exactly like a resume section item. Links show a brand
 * glyph; the rest show a field icon.
 */
import { EditableRow, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Briefcase, FileText, Globe, MapPin, User } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import {
  type EditableProfile,
  type ProfileFieldDescriptor,
  type ProfileFieldKey,
  profileFields,
} from "../lib/profile-fields";
import { usePf } from "../lib/styles";
import { BrandGlyph } from "./brand-glyph";

/** Drop the protocol/`www.` so a link reads as a handle, not a raw URL. */
function prettyLink(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export function ProfileFieldsSection({
  profile,
  onEdit,
}: {
  profile: EditableProfile | undefined;
  onEdit: (key: ProfileFieldKey) => void;
}): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const palette = useEditorialPalette();
  const fields = profileFields(t);

  const fieldIcon: Record<ProfileFieldKey, ReactNode> = {
    name: <User size={18} color={palette.muted} strokeWidth={1.75} />,
    headline: <Briefcase size={18} color={palette.muted} strokeWidth={1.75} />,
    location: <MapPin size={18} color={palette.muted} strokeWidth={1.75} />,
    bio: <FileText size={18} color={palette.muted} strokeWidth={1.75} />,
    website: <Globe size={18} color={palette.muted} strokeWidth={1.75} />,
    linkedin: null,
    github: null,
    twitter: null,
  };

  const renderRow = (field: ProfileFieldDescriptor): ReactElement => {
    const raw = profile?.[field.key];
    const value = raw ? (field.kind === "url" ? prettyLink(raw) : raw) : undefined;
    return (
      <EditableRow
        key={field.key}
        label={field.label}
        value={value}
        placeholder={t("profile.rows.add")}
        accessibilityLabel={t("profile.rows.editA11y", { label: field.label })}
        leading={
          field.brand ? (
            <BrandGlyph brand={field.brand} size={17} color={palette.muted} />
          ) : (
            fieldIcon[field.key]
          )
        }
        onPress={() => onEdit(field.key)}
      />
    );
  };

  return (
    <View style={pf.profileGroup}>
      <Text style={pf.profileGroupLabel}>{t("profile.rows.groupLabel")}</Text>
      <View style={pf.profileRows}>
        {fields.filter((f) => f.group === "profile").map(renderRow)}
      </View>

      <View style={pf.linksGroup}>
        <Text style={pf.profileGroupLabel}>{t("profile.rows.links")}</Text>
        {fields.filter((f) => f.group === "links").map(renderRow)}
      </View>
    </View>
  );
}
