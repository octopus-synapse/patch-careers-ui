/**
 * <PublicProfileScreen> — what `/u/<username>` shows a visitor.
 *
 * It is deliberately modest, because the endpoint is: `GET
 * /v1/profiles/{username}` returns the user's public columns plus the master
 * resume's METADATA — title, job title, summary — and no sections at all. So
 * this is a card about a person with links out, not a rendered resume. Mirroring
 * `/profile` here would mean inventing data.
 *
 * Chrome: the page is public, so a signed-out visitor gets the landing bar (the
 * way in). A signed-in visitor already has the app bar mounted in the root
 * layout, and rendering ours too would stack two bars on one page.
 *
 * "Not found" is a first-class state, not an error: usernames are guessable and
 * a profile can be private, so a 404 is an ordinary answer to an ordinary
 * question.
 */

import type { Locale } from "@patch-careers/i18n";
import { EmptyState } from "@patch-careers/ui";
import { IdentityMasthead, useEditorialPalette } from "@patch-careers/ui/editorial";
import { SearchX, TriangleAlert } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { NAV_BAR_HEIGHT_PUBLIC, NavBar } from "@/components/nav-bar/nav-bar";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { usePublicProfile } from "../hooks/queries";
import { displayUrl, publicProfileLinks } from "../lib/links";
import { usePp } from "../lib/styles";
import type { PublicProfileLink } from "../types";
import { PublicProfileHead } from "./public-profile-head";
import { PublicProfileLanguageLinks } from "./public-profile-language-links";

function LinkRow({ link, isLast }: { link: PublicProfileLink; isLast: boolean }): ReactElement {
  const pp = usePp();
  const [active, setActive] = useState(false);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={link.label}
      onPress={() => void Linking.openURL(link.url)}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={[pp.linkRow, isLast && pp.linkRowLast]}
    >
      <Text style={pp.linkLabel}>{link.label}</Text>
      <Text style={[pp.linkUrl, active && pp.linkUrlActive]} numberOfLines={1}>
        {displayUrl(link.url)}
      </Text>
    </Pressable>
  );
}

export function PublicProfileScreen({
  username,
  locale,
}: {
  username: string | undefined;
  /** Which language version this address serves (ADR-0011 / decision 21). */
  locale: Locale;
}): ReactElement {
  const { t } = useI18n();
  const pp = usePp();
  const palette = useEditorialPalette();
  const { isAuthenticated } = useAuthState();
  const isDesktopWeb = useIsDesktopWeb();
  const appInset = useNavBarInset();
  const { profile, isLoading, isNotFound, isError, refetch } = usePublicProfile(username, locale);

  // Signed out, the landing bar is ours to mount and it floats over the page.
  // Signed in, the root layout already mounted the app bar.
  const ownChrome = !isAuthenticated;
  const topInset = ownChrome ? NAV_BAR_HEIGHT_PUBLIC + 24 : appInset + 36;

  const chrome = ownChrome ? <NavBar variant="landing" /> : null;

  if (isLoading) {
    return (
      <View style={pp.root}>
        {chrome}
        <View style={pp.centered}>
          <ActivityIndicator color={palette.ink} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={pp.root}>
        {chrome}
        <View style={pp.centered}>
          <EmptyState
            icon={<TriangleAlert size={28} color={palette.muted} />}
            title={t("profile.publicProfile.loadFailed")}
            ctaLabel={t("profile.feedback.retry")}
            onCta={refetch}
          />
        </View>
      </View>
    );
  }

  if (isNotFound || !profile) {
    return (
      <View style={pp.root}>
        {chrome}
        <View style={pp.centered}>
          <EmptyState
            icon={<SearchX size={28} color={palette.muted} />}
            title={t("profile.publicProfile.notFoundTitle")}
            description={t("profile.publicProfile.notFoundBody")}
          />
        </View>
      </View>
    );
  }

  const { user, resume } = profile;
  const links = publicProfileLinks(user, t);
  const name = user.name ?? resume?.fullName ?? user.username;
  // The resume's job title is the closest thing the contract has to a headline;
  // the user record carries no `headline` on the public read.
  const headline = resume?.jobTitle ?? resume?.title ?? null;
  const summary = user.bio ?? resume?.summary ?? null;
  const location = user.location ?? resume?.location ?? null;
  const handle = <Text style={pp.handle}>{`@${user.username}`}</Text>;
  const masthead = (
    <IdentityMasthead
      name={name}
      headline={headline}
      location={location}
      photoURL={user.photoURL}
      wide={isDesktopWeb}
      variant={isDesktopWeb ? "card" : "page"}
      details={handle}
    />
  );
  const about = summary ? (
    <View style={[pp.card, pp.contentCard]}>
      <Text style={pp.sectionTitle}>{t("profile.publicProfile.about")}</Text>
      <Text style={pp.bio}>{summary}</Text>
    </View>
  ) : null;
  const linkCard =
    links.length > 0 ? (
      <View style={[pp.card, pp.railCard]}>
        <Text style={pp.sectionTitle}>{t("profile.publicProfile.links")}</Text>
        <View style={pp.linkList}>
          {links.map((link, index) => (
            <LinkRow key={link.key} link={link} isLast={index === links.length - 1} />
          ))}
        </View>
      </View>
    ) : null;

  return (
    <View style={pp.root}>
      <PublicProfileHead
        username={user.username}
        locale={locale}
        indexable={user.allowSearchEngineIndex}
      />
      {chrome}
      <ScrollView
        contentContainerStyle={[pp.scroll, { paddingTop: topInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={pp.column}>
          {isDesktopWeb ? (
            <View style={pp.bodyWide}>
              <View style={pp.mainWide}>
                {masthead}
                {about}
              </View>
              <View style={pp.railWide}>
                <View style={[pp.card, pp.languageCard]}>
                  <Text style={pp.sectionTitle}>{t("profile.publicProfile.languageTitle")}</Text>
                  <PublicProfileLanguageLinks username={user.username} current={locale} />
                </View>
                {linkCard}
              </View>
            </View>
          ) : (
            <>
              <PublicProfileLanguageLinks username={user.username} current={locale} />
              {masthead}
              {about}
              {linkCard}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
