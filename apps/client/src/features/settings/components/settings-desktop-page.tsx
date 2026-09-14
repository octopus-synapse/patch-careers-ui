/**
 * `SettingsDesktopPage` — every setting on one page, with the rail as a marker.
 *
 * It used to be master-detail: each section was its own route and the rail
 * replaced the pane. That hid the shape of the thing — you could not tell what
 * else existed without clicking, and switching sections cost a navigation. Now
 * the four sections stack under one scroller, the rail says which one you are
 * reading, and clicking one scrolls there. Nothing is behind a click that
 * isn't behind a scroll.
 *
 * The section ROOT routes still exist and still deep-link: they redirect here
 * with `?section=`, which this page opens at. What stays a real route is the
 * drill-downs (change e-mail, 2FA, blocked…) — those are tasks, not sections,
 * and they get a pane of their own via `SettingsScreenShell`.
 *
 * Desktop only. Mobile keeps the hub-and-push list, where one screenful cannot
 * hold four sections and a rail has nowhere to live.
 */

import { XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useEffect, useRef } from "react";
import { type LayoutChangeEvent, ScrollView } from "react-native";
import { RAIL_GAP, SettingsRail } from "@/components/settings-rail";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";
import { useSectionSpy } from "../hooks/use-section-spy";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "../lib/sections";
import { AccountSection } from "./account-section";
import { NotificationsSection } from "./notifications-section";
import { PreferencesSection } from "./preferences-section";
import { PrivacySection } from "./privacy-section";
import { SettingsSectionHeading } from "./settings-section-heading";

/** Breathing room between one section's last card and the next one's heading. */
const SECTION_GAP = 56;

const SECTION_IDS = SETTINGS_SECTIONS.map((section) => section.id);

const BODIES: Record<SettingsSectionId, () => ReactElement> = {
  account: AccountSection,
  privacy: PrivacySection,
  notifications: NotificationsSection,
  preferences: PreferencesSection,
};

export function SettingsDesktopPage(): ReactElement {
  const palette = useEditorialPalette();
  const navInset = useNavBarInset();
  const router = useRouter();
  const { t } = useI18n();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const spy = useSectionSpy<SettingsSectionId>(SECTION_IDS);

  // Open at the deep-linked section — once. Re-running on every param read
  // would yank the page back up mid-scroll.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current) return;
    const target = SECTION_IDS.find((id) => id === section);
    if (target === undefined) {
      landed.current = true;
      return;
    }
    // A frame's grace for the sections to report their offsets; without one
    // there is nothing to scroll to yet.
    const timer = setTimeout(() => {
      spy.scrollToSection(target, false);
      landed.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [section, spy.scrollToSection]);

  return (
    <XStack flex={1} backgroundColor={palette.bg} paddingHorizontal={16}>
      {/* The rail holds still while only the sections scroll. */}
      <YStack paddingTop={navInset + 24}>
        <SettingsRail
          activeId={spy.activeId}
          onSelect={(id) => {
            spy.scrollToSection(id);
            // Keep the URL honest, so a reload or a share lands where you are.
            router.setParams({ section: id });
          }}
        />
      </YStack>

      <YStack flex={1} minWidth={0} marginLeft={RAIL_GAP}>
        <ScrollView
          ref={spy.scrollRef}
          onScroll={spy.onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: navInset + 24, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {SETTINGS_SECTIONS.map((entry, index) => {
            const Body = BODIES[entry.id];
            return (
              <YStack
                key={entry.id}
                marginTop={index === 0 ? 0 : SECTION_GAP}
                onLayout={(event: LayoutChangeEvent) =>
                  spy.onSectionLayout(entry.id, event.nativeEvent.layout.y)
                }
              >
                <SettingsSectionHeading
                  title={t(entry.labelKey)}
                  description={t(entry.descriptionKey)}
                />
                <Body />
              </YStack>
            );
          })}
        </ScrollView>
      </YStack>
    </XStack>
  );
}
