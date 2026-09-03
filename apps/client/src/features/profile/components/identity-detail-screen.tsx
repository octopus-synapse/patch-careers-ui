/**
 * <IdentityDetailScreen> — the "Identidade" row's sub-screen (settings-style):
 * the User-backed identity fields (name / headline / location / bio / phone /
 * email) as tappable rows that open the focused field editor. Reuses the
 * settings screen shell so it matches Conta/Privacidade/etc.
 */
import { type ReactElement, useState } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { useI18n } from "@/providers/i18n-provider";
import { useProfile } from "../hooks/queries";
import { useSaveProfileField } from "../hooks/use-save-profile-field";
import { type ProfileFieldKey, profileFields } from "../lib/profile-fields";
import { IdentityCard } from "./identity-card";
import { ProfileFieldEditor } from "./profile-field-editor";

export function IdentityDetailScreen(): ReactElement {
  const { t } = useI18n();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const [editing, setEditing] = useState<ProfileFieldKey | null>(null);
  const activeField = editing ? (profileFields(t).find((f) => f.key === editing) ?? null) : null;

  const { saveField, isPending } = useSaveProfileField();

  return (
    <SettingsScreenShell title={t("profile.sections.identity")}>
      <IdentityCard profile={profile} onEdit={setEditing} />

      {activeField ? (
        <ProfileFieldEditor
          key={activeField.key}
          descriptor={activeField}
          initialValue={profile?.[activeField.key] ?? ""}
          open
          onClose={() => setEditing(null)}
          onSave={(value) => saveField(activeField.key, value)}
          isPending={isPending}
        />
      ) : null}
    </SettingsScreenShell>
  );
}
