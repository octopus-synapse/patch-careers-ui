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

import { useEditorialPalette } from "@patch-careers/ui/editorial";
import * as ImagePicker from "expo-image-picker";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { ResumeListTab } from "@/features/resumes";
import { useProfile, useProfileMutations } from "../hooks/queries";
import { usePf } from "../lib/styles";
import { AboutEditSheet, IdentityEditSheet, SocialLinksEditSheet } from "./edit-sheets";
import { MasterSectionsTab } from "./master-sections-tab";
import { ProfileHeader } from "./profile-header";
import { type ProfileSubTab, ProfileSubTabs } from "./profile-sub-tabs";

export type SheetKind = "identity" | "about" | "links";

export function ProfileScreen(): ReactElement {
  const palette = useEditorialPalette();
  const pf = usePf();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const { updateProfile, updatePhoto, isPending: profilePending } = useProfileMutations();
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [tab, setTab] = useState<ProfileSubTab>("perfil");

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
      <ScrollView contentContainerStyle={pf.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          profile={profile}
          onChangePhoto={() => void onChangePhoto()}
          onEdit={setSheet}
        />

        <ProfileSubTabs value={tab} onChange={setTab} />

        {tab === "perfil" ? <MasterSectionsTab /> : <ResumeListTab />}
      </ScrollView>

      <IdentityEditSheet
        open={sheet === "identity"}
        onOpenChange={(open) => setSheet(open ? "identity" : null)}
        profile={profile}
        isPending={profilePending}
        onSubmit={updateProfile}
      />
      <AboutEditSheet
        open={sheet === "about"}
        onOpenChange={(open) => setSheet(open ? "about" : null)}
        profile={profile}
        isPending={profilePending}
        onSubmit={updateProfile}
      />
      <SocialLinksEditSheet
        open={sheet === "links"}
        onOpenChange={(open) => setSheet(open ? "links" : null)}
        profile={profile}
        isPending={profilePending}
        onSubmit={updateProfile}
      />
    </View>
  );
}
