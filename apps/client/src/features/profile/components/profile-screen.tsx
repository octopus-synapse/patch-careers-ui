/**
 * Profile tab — the user's master-resume home, now a single page (the old
 * Instagram-style sub-tabs are gone: Currículos became its own bottom-bar
 * tab and Desempenho became the score hero's sheet):
 *
 *   identity header → score hero (fixed scores; tap = Desempenho sheet) →
 *   Fit Profile card (unlocks per-job Match) → master sections (add via the
 *   floating "Adicionar ao perfil" CTA, tap to edit, swipe to delete).
 *
 * The old completeness card and public-profile link are gone by design.
 */

import { getV1MeScoresQueryKey, getV1ResumesQueryKey } from "@patch-careers/api-client";
import { EmptyState } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { TriangleAlert } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";
import { useProfile, useProfileCompleteness, useProfileMutations } from "../hooks/queries";
import { useProfileCover } from "../hooks/use-profile-cover";
import { usePf } from "../lib/styles";
import { FitProfileCard } from "./fit-profile-card";
import { ImageActionSheet } from "./image-action-sheet";
import { MasterAddSection } from "./master-add-section";
import { MasterSectionsTab } from "./master-sections-tab";
import { PerformanceSheet } from "./performance-sheet";
import { ProfileHeader } from "./profile-header";
import { ProfileSkeleton } from "./profile-skeleton";
import { ResumePreviewCard } from "./resume-preview-card";
import { ScoreHero } from "./score-hero";

export function ProfileScreen(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  // Bar floats over content; pad the scroll so the last items clear it.
  const tabBarHeight = useBottomTabBarHeight();
  const navInset = useNavBarInset();
  // Desktop web: two-column body (sections main + insights rail) and the add
  // CTA lives inline in the rail instead of floating over a bottom bar.
  const isDesktopWeb = useIsDesktopWeb();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const { updatePhoto, removePhoto, photoPending } = useProfileMutations();
  const { coverURL, updateCover, removeCover, coverPending } = useProfileCover();
  const { percent: completeness } = useProfileCompleteness();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [coverSheetOpen, setCoverSheetOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);

  // Pull-to-refresh re-pulls the profile, the resume list (which drives the
  // master sections, completeness gauge, and quality panel), and the scores.
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        profileQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getV1MeScoresQueryKey() }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // `allowsEditing` opens the native crop/zoom UI for both sources, so the
  // image is framed — square for the avatar, banner-shaped for the cover —
  // before it ever leaves the device.
  const pick = async (
    source: "camera" | "gallery",
    aspect: [number, number],
  ): Promise<ImagePicker.ImagePickerAsset | undefined> => {
    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return undefined;
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect,
            quality: 0.85,
          });
    return result.canceled ? undefined : result.assets[0];
  };

  const pickAndUploadPhoto = async (source: "camera" | "gallery"): Promise<void> => {
    const asset = await pick(source, [1, 1]);
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

  const pickAndUploadCover = async (source: "camera" | "gallery"): Promise<void> => {
    const asset = await pick(source, [3, 1]);
    if (!asset) return;
    // Its own toasts; nothing to roll back (the store only takes the URL that
    // came back from a successful upload).
    await updateCover({
      uri: asset.uri,
      name: asset.fileName ?? "cover.jpg",
      type: asset.mimeType ?? "image/jpeg",
    });
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

  // The floating add CTA is pinned over the scroll; reserve room at the
  // bottom so the last list items clear it.
  const floatingAddHeight = 58 + 32; // slab height + breathing room

  return (
    <View style={pf.root}>
      <ScrollView
        contentContainerStyle={[
          pf.scroll,
          {
            paddingTop: navInset,
            paddingBottom: isDesktopWeb ? 56 : tabBarHeight + floatingAddHeight,
          },
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
          onChangeCover={() => setCoverSheetOpen(true)}
          coverURL={coverURL}
          uploading={photoPending}
          coverUploading={coverPending}
          completeness={completeness}
        />

        {isDesktopWeb ? (
          <View style={pf.bodyWide}>
            <View style={pf.mainColWide}>
              <MasterSectionsTab profile={profile} showPreview={false} />
              <MasterAddSection variant="ink" />
            </View>
            <View style={pf.railWide}>
              <ScoreHero onOpen={() => setPerformanceOpen(true)} />
              <FitProfileCard />
              <ResumePreviewCard />
            </View>
          </View>
        ) : (
          <>
            <ScoreHero onOpen={() => setPerformanceOpen(true)} />
            <FitProfileCard />

            <MasterSectionsTab profile={profile} />
          </>
        )}
      </ScrollView>

      {isDesktopWeb ? null : (
        <View pointerEvents="box-none" style={[pf.floatingAdd, { bottom: tabBarHeight + 16 }]}>
          <MasterAddSection />
        </View>
      )}

      <PerformanceSheet open={performanceOpen} onOpenChange={setPerformanceOpen} />

      <ImageActionSheet
        open={photoSheetOpen}
        onClose={() => setPhotoSheetOpen(false)}
        onCamera={() => void pickAndUploadPhoto("camera")}
        onGallery={() => void pickAndUploadPhoto("gallery")}
        onRemove={() => void removePhoto()}
        canRemove={Boolean(profile?.photoURL)}
      />

      <ImageActionSheet
        open={coverSheetOpen}
        kind="cover"
        onClose={() => setCoverSheetOpen(false)}
        onCamera={() => void pickAndUploadCover("camera")}
        onGallery={() => void pickAndUploadCover("gallery")}
        onRemove={removeCover}
        canRemove={Boolean(coverURL)}
      />
    </View>
  );
}
