/**
 * Profile tab — the user's master-resume manager. Identity header on top
 * (avatar / name / headline / location + edit-sheet triggers), then two
 * Instagram-style sub-tabs:
 *
 *   Perfil      → section manager of the master resume (add via the single
 *                 bottom box, tap to edit, swipe to delete — no reordering);
 *   Currículos  → the user's resumes (master first, slots, derive-from-master
 *                 wizard, per-resume preview/detail).
 *
 * The old completeness card and public-profile link are gone by design.
 */

import type { PatchV1UsersProfileMutationRequest } from "@patch-careers/api-client";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { ResumeListTab } from "@/features/resumes";
import { useI18n } from "@/providers/i18n-provider";
import { useProfile, useProfileMutations } from "../hooks/queries";
import { type ProfileFieldKey, profileFields } from "../lib/profile-fields";
import { usePf } from "../lib/styles";
import { FieldEditModal } from "./field-edit-modal";
import { LocationEditModal } from "./location-edit-modal";
import { MasterSectionsTab } from "./master-sections-tab";
import { ProfileHeader } from "./profile-header";
import { type ProfileSubTab, ProfileSubTabs } from "./profile-sub-tabs";

export function ProfileScreen(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  // Bar floats over content; pad the scroll so the last items clear it.
  const tabBarHeight = useBottomTabBarHeight();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const { updateProfile, updatePhoto, isPending: profilePending } = useProfileMutations();
  const [editing, setEditing] = useState<ProfileFieldKey | null>(null);
  const [tab, setTab] = useState<ProfileSubTab>("perfil");
  const activeField = editing ? (profileFields(t).find((f) => f.key === editing) ?? null) : null;

  const saveField = async (key: ProfileFieldKey, value: string): Promise<void> => {
    const trimmed = value.trim();
    await updateProfile((trimmed ? { [key]: trimmed } : {}) as PatchV1UsersProfileMutationRequest);
  };

  const onChangePhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    try {
      await updatePhoto({
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
    } catch {
      // Surfaced via the mutation; header keeps the prior photo.
    }
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[pf.root, pf.centered]}>
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  return (
    <View style={pf.root}>
      <ScrollView
        contentContainerStyle={[pf.scroll, { paddingBottom: tabBarHeight }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader profile={profile} onChangePhoto={() => void onChangePhoto()} />

        <ProfileSubTabs value={tab} onChange={setTab} />

        {tab === "perfil" ? (
          <MasterSectionsTab profile={profile} onEdit={setEditing} />
        ) : (
          <ResumeListTab />
        )}
      </ScrollView>

      {activeField?.kind === "location" ? (
        <LocationEditModal
          open
          onClose={() => setEditing(null)}
          onSave={(label) => saveField("location", label)}
        />
      ) : activeField ? (
        <FieldEditModal
          key={activeField.key}
          descriptor={activeField}
          initialValue={profile?.[activeField.key] ?? ""}
          open
          onClose={() => setEditing(null)}
          onSave={(value) => saveField(activeField.key, value)}
          isPending={profilePending}
        />
      ) : null}
    </View>
  );
}
