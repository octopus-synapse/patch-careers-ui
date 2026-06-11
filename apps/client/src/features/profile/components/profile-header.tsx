/**
 * Identity header of the Profile tab: avatar (tap to change photo), name,
 * headline, location — plus the compact trigger row for the identity / about
 * / links edit sheets (the old body sections collapsed into entry points; the
 * tab's body now belongs to the sub-tabs).
 */
import { Avatar } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Camera, MapPin } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { usePf } from "../lib/styles";
import type { SheetKind } from "./profile-screen";

export type HeaderProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  photoURL?: string | null;
};

const EDIT_TRIGGERS: ReadonlyArray<{ kind: SheetKind; label: string }> = [
  { kind: "identity", label: "Editar perfil" },
  { kind: "about", label: "Sobre" },
  { kind: "links", label: "Links" },
];

export function ProfileHeader({
  profile,
  onChangePhoto,
  onEdit,
}: {
  profile: HeaderProfile | undefined;
  onChangePhoto: () => void;
  onEdit: (sheet: SheetKind) => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const pf = usePf();
  const name = profile?.name ?? "Você";

  return (
    <View style={pf.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trocar foto de perfil"
        onPress={onChangePhoto}
        style={pf.avatarWrap}
      >
        <Avatar src={profile?.photoURL ?? undefined} name={name} size="xl" />
        <View style={pf.avatarBadge}>
          <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
        </View>
      </Pressable>
      <Text style={pf.name}>{name}</Text>
      {profile?.headline ? (
        <Text style={pf.headline}>{profile.headline}</Text>
      ) : (
        <Text style={[pf.headline, pf.headlinePlaceholder]}>Adicione um título profissional</Text>
      )}
      {profile?.location ? (
        <View style={pf.locationRow}>
          <MapPin size={13} color={palette.subtle} strokeWidth={1.75} />
          <Text style={pf.location}>{profile.location}</Text>
        </View>
      ) : null}

      <View style={pf.editTriggers}>
        {EDIT_TRIGGERS.map(({ kind, label }, index) => (
          <View key={kind} style={pf.editTriggerWrap}>
            {index > 0 ? <Text style={pf.editTriggerDot}>·</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              hitSlop={6}
              onPress={() => onEdit(kind)}
            >
              <Text style={pf.editLink}>{label}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
