/**
 * Profile tab — the user's master-resume home.
 *
 * Two layouts, one screen:
 *
 * MOBILE / NARROW WEB (unchanged): identity header → score hero (tap =
 * Desempenho sheet) → Fit Profile card → the master sections as an INDEX,
 * each row pushing its own detail screen, with the floating add CTA.
 *
 * DESKTOP WEB: two columns starting at the SAME top edge — the cover and the
 * rail's first card begin on one line. The main column is a stack of cards
 * (masthead, identity, one per section) with every item rendered OPEN, so
 * filling in a phone number no longer costs three navigations. The rail
 * carries the resume language, the public URL, the score, and the sections
 * still missing — what used to be invisible until you went looking.
 *
 * The drill-down routes stay: they are what mobile and narrow web use, and
 * they are still linkable.
 */

import { getV1MeScoresQueryKey, getV1ResumesQueryKey } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { EmptyState } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { TriangleAlert } from "lucide-react-native";
import { type ReactElement, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import {
  needsTranslation,
  ResumeQualityPanel,
  resumeLanguageToLocale,
  useMasterResumeId,
  useTranslateNow,
  useTranslationProgress,
  useTranslationStatus,
} from "@/features/resumes";
import { ResumeSectionsManager, type SectionsManagerHandle } from "@/features/sections";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";
import { useProfile, useProfileCompleteness, useProfileMutations } from "../hooks/queries";
import { useProfileCover } from "../hooks/use-profile-cover";
import { usePf } from "../lib/styles";
import { FitProfileCard } from "./fit-profile-card";
import { IdentityPanelCard } from "./identity-panel-card";
import { ImageActionSheet } from "./image-action-sheet";
import { MasterAddSection } from "./master-add-section";
import { MasterSectionsTab } from "./master-sections-tab";
import { PerformanceSheet } from "./performance-sheet";
import { ProfileGapsCard } from "./profile-gaps-card";
import { ProfileHeader } from "./profile-header";
import { ProfileLanguageCard } from "./profile-language-card";
import { ProfileScoreCard } from "./profile-score-card";
import { ProfileScoreDialog } from "./profile-score-dialog";
import { ProfileSkeleton } from "./profile-skeleton";
import { PublicProfileCard } from "./public-profile-card";
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
  const [scoreOpen, setScoreOpen] = useState(false);
  const { resumeId, language, updatedAt } = useMasterResumeId();
  // The quality panel's "fix this" used to `router.push` into a detail route.
  // On desktop the sections are already open on this page, so it opens the
  // item in place through the manager instead of navigating away from it.
  const sectionsRef = useRef<SectionsManagerHandle>(null);
  // ADR-0011, profile surface: chrome (section titles, labels, dates, enums)
  // follows the app; content follows the version the rail's switcher shows.
  // The switcher persists once `UpdateResumeRequest` carries `language`; until
  // then it is the view choice, seeded from the master resume's language.
  const { locale: uiLocale } = useI18n();
  const [localeOverride, setLocaleOverride] = useState<Locale | null>(null);
  const contentLocale: Locale = localeOverride ?? resumeLanguageToLocale(language) ?? uiLocale;
  const canonicalLocale: Locale = resumeLanguageToLocale(language) ?? uiLocale;
  const sectionLocales = {
    chrome: uiLocale,
    content: contentLocale,
    canonical: canonicalLocale,
  } as const;
  // The other version should already exist (created after onboarding, or by
  // the worker after every change). When it does not — an account from
  // before, or a brake that held — the first switch derives it now and the
  // rail shows the run section by section (ADR-003 §10).
  const translationStatus = useTranslationStatus(resumeId);
  const translationProgress = useTranslationProgress(resumeId);
  const { translateNow } = useTranslateNow();
  const switchContentLocale = (next: Locale): void => {
    setLocaleOverride(next);
    if (resumeId && needsTranslation(translationStatus.forLocale(next))) {
      translateNow(resumeId, next).catch(() => undefined); // the rail reports the outcome
    }
  };

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
            paddingTop: isDesktopWeb ? navInset + 36 : navInset,
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
        {isDesktopWeb ? (
          <View style={pf.bodyWide}>
            <View style={pf.mainColWide}>
              {/* Inside a card the completeness ring would sit on the avatar of
                  the first card of a column — the score already has a panel of
                  its own in the rail, and two gauges for the same idea read as
                  two different numbers. */}
              <ProfileHeader
                variant="card"
                profile={profile}
                onChangePhoto={() => setPhotoSheetOpen(true)}
                onChangeCover={() => setCoverSheetOpen(true)}
                coverURL={coverURL}
                uploading={photoPending}
                coverUploading={coverPending}
                completeness={null}
              />
              <IdentityPanelCard />
              <ResumeSectionsManager
                ref={sectionsRef}
                resumeId={resumeId}
                locales={sectionLocales}
                variant="expanded"
                addPlacement="perSection"
              />
              {/* Closes the column: what the robot complained about, and a way
                  straight to the item that caused it. Without this the desktop
                  loses the "fix this" deep link that the mobile index has. */}
              {resumeId ? (
                <ResumeQualityPanel
                  resumeId={resumeId}
                  {...(updatedAt ? { updatedAt } : {})}
                  onOpenIssue={(sectionKey, itemIndex) =>
                    sectionsRef.current?.openItem(sectionKey, itemIndex)
                  }
                />
              ) : null}
            </View>

            <View style={pf.railWide}>
              <ProfileLanguageCard
                value={contentLocale}
                onChange={switchContentLocale}
                status={translationStatus.forLocale(contentLocale)}
                progress={translationProgress}
              />
              <PublicProfileCard username={profile?.username ?? null} />
              <ProfileScoreCard onOpen={() => setScoreOpen(true)} />
              <ProfileGapsCard resumeId={resumeId} locales={sectionLocales} />
              {/* The generic door, after the specific ones: the rail names the
                  four sections worth doing next, and this is for everything
                  else. */}
              <MasterAddSection variant="ink" />
              <FitProfileCard />
              <ResumePreviewCard />
            </View>
          </View>
        ) : (
          <>
            <ProfileHeader
              profile={profile}
              onChangePhoto={() => setPhotoSheetOpen(true)}
              onChangeCover={() => setCoverSheetOpen(true)}
              coverURL={coverURL}
              uploading={photoPending}
              coverUploading={coverPending}
              completeness={completeness}
            />
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

      <ProfileScoreDialog
        open={scoreOpen}
        onOpenChange={setScoreOpen}
        onOpenPerformance={() => setPerformanceOpen(true)}
      />

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
