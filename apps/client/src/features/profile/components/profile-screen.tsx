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

import { getV1ResumesQueryKey } from "@patch-careers/api-client";
import { EmptyState } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TriangleAlert } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { ResumeListTab } from "@/features/resumes";
import { useI18n } from "@/providers/i18n-provider";
import { useProfile, useProfileCompleteness, useProfileMutations } from "../hooks/queries";
import { usePf } from "../lib/styles";
import { AvatarActionSheet } from "./avatar-action-sheet";
import { MasterAddSection } from "./master-add-section";
import { MasterSectionsTab } from "./master-sections-tab";
import { ProfileHeader } from "./profile-header";
import { ProfileSkeleton } from "./profile-skeleton";
import { type ProfileSubTab, ProfileSubTabs } from "./profile-sub-tabs";

export function ProfileScreen(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  // Bar floats over content; pad the scroll so the last items clear it.
  const tabBarHeight = useBottomTabBarHeight();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const { updatePhoto, removePhoto, photoPending } = useProfileMutations();
  const { percent: completeness } = useProfileCompleteness();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  // Sub-tab is URL-driven so it's deep-linkable (?tab=curriculos) and survives
  // re-renders / back navigation without local state.
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: ProfileSubTab = params.tab === "curriculos" ? "curriculos" : "perfil";
  const setTab = (next: ProfileSubTab): void => {
    router.setParams({ tab: next });
  };

  // Pull-to-refresh re-pulls the profile and the resume list (which drives the
  // master sections, completeness gauge, and quality panel).
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        profileQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // `allowsEditing` opens the native crop/zoom UI for both sources, keeping
  // the avatar square before it ever leaves the device.
  const pickAndUpload = async (source: "camera" | "gallery"): Promise<void> => {
    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
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
      // Surfaced via the mutation; the optimistic preview rolls back.
    }
  };

  if (profileQuery.isLoading) {
    return (
      <View style={pf.root}>
        <ProfileSkeleton />
      </View>
    );
  }

  if (profileQuery.isError) {
    return (
      <View style={[pf.root, pf.centered]}>
        <EmptyState
          icon={<TriangleAlert size={28} color={palette.muted} />}
          title={t("profile.feedback.loadFailed")}
          ctaLabel={t("profile.feedback.retry")}
          onCta={() => void profileQuery.refetch()}
        />
      </View>
    );
  }

  // The "Perfil" sub-tab pins a floating add CTA over the scroll; reserve room
  // at the bottom so the last list items clear it.
  const onPerfil = tab === "perfil";
  const floatingAddHeight = 58 + 32; // slab height + breathing room

  return (
    <View style={pf.root}>
      <ScrollView
        contentContainerStyle={[
          pf.scroll,
          { paddingBottom: tabBarHeight + (onPerfil ? floatingAddHeight : 0) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={palette.muted}
          />
        }
      >
        <ProfileHeader
          profile={profile}
          onChangePhoto={() => setPhotoSheetOpen(true)}
          uploading={photoPending}
          completeness={completeness}
        />

        <ProfileSubTabs value={tab} onChange={setTab} />

        {onPerfil ? <MasterSectionsTab profile={profile} /> : <ResumeListTab />}
      </ScrollView>

      {onPerfil ? (
        <View pointerEvents="box-none" style={[pf.floatingAdd, { bottom: tabBarHeight + 16 }]}>
          <MasterAddSection />
        </View>
      ) : null}

      <AvatarActionSheet
        open={photoSheetOpen}
        onClose={() => setPhotoSheetOpen(false)}
        onCamera={() => void pickAndUpload("camera")}
        onGallery={() => void pickAndUpload("gallery")}
        onRemove={() => void removePhoto()}
        canRemove={Boolean(profile?.photoURL)}
      />
    </View>
  );
}
