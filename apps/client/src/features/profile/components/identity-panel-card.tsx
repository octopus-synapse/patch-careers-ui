/**
 * <IdentityPanelCard> — the identity block of the desktop profile, rendered
 * open instead of as a row that pushes `/profile/identity`.
 *
 * Filled fields are a label/value table; the blank ones are named under a
 * "FALTA" rule rather than left as five identical "Adicionar" placeholders,
 * which is what made an empty profile look as complete as a finished one.
 *
 * Editing is the same machinery the detail screen uses — `ProfileFieldEditor`
 * over `useSaveProfileField()` — so location still goes through
 * the geo picker and a phone still gets the phone control. Nothing about the
 * write path is new here; only where it is reached from.
 *
 * Desktop web only: the caller renders it inside `useIsDesktopWeb()`. Mobile
 * and narrow web keep the index + detail-screen flow untouched.
 */

import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Pencil } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SectionPanelCard, webNoOutline } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import { useProfile } from "../hooks/queries";
import { useSaveProfileField } from "../hooks/use-save-profile-field";
import { filledProfileFields, missingProfileFields } from "../lib/missing-fields";
import type { ProfileFieldDescriptor, ProfileFieldKey } from "../lib/profile-fields";
import { usePf } from "../lib/styles";
import { ProfileFieldEditor } from "./profile-field-editor";

function IdentityRow({
  descriptor,
  value,
  isLast,
  onEdit,
}: {
  descriptor: ProfileFieldDescriptor;
  value: string;
  isLast: boolean;
  onEdit: () => void;
}): ReactElement {
  const pf = usePf();
  const palette = useEditorialPalette();
  const [active, setActive] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={descriptor.label}
      onPress={onEdit}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={[pf.idRow, isLast && pf.idRowLast, webNoOutline]}
    >
      <Text style={pf.idLabel}>{descriptor.label}</Text>
      <Text style={pf.idValue}>{value}</Text>
      {/* Under the pointer only: a permanent icon on every row of a table this
          quiet is noise for an action the whole row already performs. */}
      <Pencil
        size={14}
        color={active ? palette.subtle : palette.panel}
        strokeWidth={2}
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

export function IdentityPanelCard(): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const profile = useProfile().data;
  const { saveField, isPending } = useSaveProfileField();
  const [editing, setEditing] = useState<ProfileFieldDescriptor | null>(null);

  const filled = filledProfileFields(profile, t);
  const missing = missingProfileFields(profile, t);

  const save = async (key: ProfileFieldKey, value: string): Promise<void> => {
    const trimmed = value.trim();
    // An emptied field is a delete, and the contract takes the absence of the
    // key rather than an empty string — same shape the detail screen sends.
    await saveField(key, trimmed);
  };

  return (
    <>
      <SectionPanelCard
        title={t("profile.sections.identity")}
        // The door only exists while there is something behind it: with every
        // field filled, "Adicionar campo" would open an editor for nothing.
        addLabel={missing[0] ? t("profile.identity.addField") : undefined}
        onAdd={missing[0] ? () => setEditing(missing[0] ?? null) : undefined}
      >
        <View>
          {filled.map((field, index) => (
            <IdentityRow
              key={field.key}
              descriptor={field}
              value={profile?.[field.key] ?? ""}
              isLast={index === filled.length - 1}
              onEdit={() => setEditing(field)}
            />
          ))}
        </View>

        {missing.length > 0 ? (
          <View style={pf.idGaps}>
            <Text style={pf.smallcaps}>{t("profile.identity.missing")}</Text>
            <View style={pf.gapList}>
              {missing.map((field) => (
                <View key={field.key} style={pf.gapRow}>
                  <Text style={pf.gapDash}>—</Text>
                  <Text style={pf.gapText}>{field.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </SectionPanelCard>

      {editing ? (
        <ProfileFieldEditor
          key={editing.key}
          descriptor={editing}
          initialValue={profile?.[editing.key] ?? ""}
          open
          onClose={() => setEditing(null)}
          onSave={(value) => save(editing.key, value)}
          isPending={isPending}
        />
      ) : null}
    </>
  );
}
