/**
 * "Perfil" supersection — the identity block. Name, professional title,
 * location, summary (bio) and phone are User-backed (PATCH /v1/users/profile)
 * but render as tappable rows exactly like a resume section item; email is shown
 * read-only (managed in the account). This is the one intentional seam: the UI
 * reads as a section, the data source is the User.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import {
  EditableRow,
  editorialFonts as fonts,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { Briefcase, ChevronRight, FileText, MapPin, Phone, User } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { type EditableProfile, type ProfileFieldKey, profileFields } from "../lib/profile-fields";

export function IdentityCard({
  profile,
  onEdit,
}: {
  profile: EditableProfile | undefined;
  onEdit: (key: ProfileFieldKey) => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  const router = useRouter();
  const fields = profileFields(t);

  const fieldIcon: Record<ProfileFieldKey, ReactNode> = {
    name: <User size={18} color={palette.muted} strokeWidth={1.75} />,
    headline: <Briefcase size={18} color={palette.muted} strokeWidth={1.75} />,
    location: <MapPin size={18} color={palette.muted} strokeWidth={1.75} />,
    bio: <FileText size={18} color={palette.muted} strokeWidth={1.75} />,
    phone: <Phone size={18} color={palette.muted} strokeWidth={1.75} />,
  };

  const email = profile?.email?.trim();

  return (
    <View style={styles.group}>
      {fields.map((field) => {
        const raw = profile?.[field.key];
        return (
          <EditableRow
            key={field.key}
            label={field.label}
            value={raw ? raw : undefined}
            placeholder={t("profile.rows.add")}
            accessibilityLabel={t("profile.rows.editA11y", { label: field.label })}
            leading={fieldIcon[field.key]}
            onPress={() => onEdit(field.key)}
          />
        );
      })}

      {email ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("profile.rows.emailManageA11y")}
          onPress={() => router.push("/settings/change-email")}
          style={({ pressed }) => [styles.readonlyRow, pressed ? styles.readonlyRowPressed : null]}
        >
          <View style={styles.readonlyBody}>
            <Text style={styles.readonlyLabel}>{t("profile.rows.emailLabel")}</Text>
            <Text style={styles.readonlyValue} numberOfLines={1}>
              {email}
            </Text>
            <Text style={styles.readonlyHint}>{t("profile.rows.emailReadonly")}</Text>
          </View>
          <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />
        </Pressable>
      ) : null}
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    group: { gap: 10 },
    readonlyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 14,
      backgroundColor: p.surface,
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    readonlyRowPressed: { backgroundColor: p.bg },
    readonlyBody: { flex: 1, gap: 2 },
    readonlyLabel: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: p.muted,
    },
    readonlyValue: { fontFamily: fonts.sans, fontSize: 15, color: p.ink },
    readonlyHint: { fontFamily: fonts.sans, fontSize: 11, color: p.subtle, fontStyle: "italic" },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
