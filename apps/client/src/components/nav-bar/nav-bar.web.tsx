/**
 * Persistent web navigation. The app variant follows navbar v12 and mounts
 * above the router Stack; public/auth/onboarding screens own their variants.
 * Auth, route and breakpoint gates keep app chrome off standalone flows.
 */

import {
  useGetV1ChatUnread,
  useGetV1NotificationsUnreadCount,
  useGetV1UsersProfile,
} from "@patch-careers/api-client";
import { appNavPalette, authDialogPalette, landingScrollPalette } from "@patch-careers/tokens";
import { Button, Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { usePathname, useRouter } from "expo-router";
import { ArrowUpRight, createLucideIcon } from "lucide-react-native";
import {
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Pressable, useWindowDimensions, type View } from "react-native";
import { AuthDialog } from "@/components/auth/auth-dialog/auth-dialog";
import { landingSans, navigateLandingChapter } from "@/features/landing";
import { SearchModal, SearchTrigger } from "@/features/search";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useDismissOnOutside } from "@/hooks/use-dismiss-on-outside";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { AccountMenu, type AccountMenuVariant } from "./account-menu";
import { AccountTrigger } from "./account-trigger.web";
import { GlassCircleButton } from "./glass-circle-button";
import {
  NAV_APP_MAX_WIDTH,
  NAV_APP_TIGHT_BREAKPOINT,
  NAV_BAR_HEIGHT_APP,
  NAV_BAR_HEIGHT_PUBLIC,
  NAV_CONTROL_SIZE,
  NAV_CONTROL_SIZE_APP,
  type NavAccount,
  type NavBarVariant,
  type NavProgress,
} from "./nav-bar.contract";
import { NavBrand } from "./nav-brand";
import { NavGlyph } from "./nav-glyph.web";
import { NavLinks } from "./nav-links.web";
import { activeNavKey, isChromePath, type NavKey } from "./nav-routes";
import { PreferencesModal, type PreferencesTab } from "./preferences-modal";
import { useNavMedia } from "./use-nav-media.web";

export {
  NAV_BAR_HEIGHT_APP,
  NAV_BAR_HEIGHT_PUBLIC,
  type NavAccount,
  type NavBarVariant,
  type NavProgress,
  PUBLIC_NAV_BAR_HEIGHT,
} from "./nav-bar.contract";

const COMPACT_BREAKPOINT = 480;
/** Under the ChapterRail (50) and the BootOverlay (100) on the landing. */
const PUBLIC_Z_INDEX = 40;
/**
 * With the panel open the bar has to clear the ChapterRail, which otherwise
 * paints its chapter list straight through the menu. Still under the
 * BootOverlay (100), which is allowed to cover everything.
 */
const PUBLIC_Z_INDEX_OPEN = 60;
const BRAND_HEIGHT = 50;
const BRAND_HEIGHT_COMPACT = 40;
const LANDING_NAV_CHAPTERS = ["hero", "dor", "vivo", "notas", "cta"] as const;

/** Three staggered strokes matching the menu reference. */
const StaggeredMenu = createLucideIcon("StaggeredMenu", [
  ["path", { d: "M7 6h13", key: "top" }],
  ["path", { d: "M3 12h18", key: "middle" }],
  ["path", { d: "M7 18h9", key: "bottom" }],
]);

export type NavBarProps = {
  readonly variant: NavBarVariant;
  readonly progress?: NavProgress;
  readonly account?: NavAccount;
};

export function NavBar({ variant, progress, account }: NavBarProps): ReactElement | null {
  const isDesktopWeb = useIsDesktopWeb();
  const pathname = usePathname();
  const router = useRouter();
  const localized = useLocalizedHref();
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const { currentUser, isAuthenticated } = useAuthState();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  const tight = width < NAV_APP_TIGHT_BREAKPOINT;
  const reducedMotion = useNavMedia("(prefers-reduced-motion: reduce)");
  const menuId = useId();

  const [menuOpen, setMenuOpen] = useState(false);
  const [prefsTab, setPrefsTab] = useState<PreferencesTab | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [landingActiveChapter, setLandingActiveChapter] = useState("hero");
  // Anchor wrapper around the account trigger + panel: outside-click dismissal
  // checks containment against this node (on web the ref IS the DOM element).
  const menuAnchor = useRef<View | null>(null);

  useEffect(() => {
    if (variant !== "landing" || typeof window === "undefined") return;
    const onLandingChapter = (event: Event) => {
      const chapter = (event as CustomEvent<string>).detail;
      if (LANDING_NAV_CHAPTERS.includes(chapter as (typeof LANDING_NAV_CHAPTERS)[number])) {
        setLandingActiveChapter(chapter);
      }
    };
    window.addEventListener("patch:landing-active", onLandingChapter);
    window.addEventListener("patch:landing-navigate", onLandingChapter);
    return () => {
      window.removeEventListener("patch:landing-active", onLandingChapter);
      window.removeEventListener("patch:landing-navigate", onLandingChapter);
    };
  }, [variant]);

  const isApp = variant === "app";
  const show =
    !isApp ||
    (isDesktopWeb &&
      isAuthenticated &&
      !currentUser?.needsEmailVerification &&
      isChromePath(pathname));

  const profile = useGetV1UsersProfile({ query: { enabled: show && isApp } });
  const chat = useGetV1ChatUnread({
    query: { enabled: show && isApp, refetchInterval: 30_000 },
  });
  const notifications = useGetV1NotificationsUnreadCount({
    query: { enabled: show && isApp, refetchInterval: 30_000 },
  });

  useDismissOnOutside(menuAnchor, menuOpen, () => setMenuOpen(false));

  // The shortcut remains available even though v12 no longer displays the hint.
  useEffect(() => {
    if (!isApp || !show || typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isApp, show]);

  useEffect(() => {
    if (!isApp || !show || !menuOpen) return;
    const onFocus = (event: FocusEvent) => {
      const anchor = menuAnchor.current as unknown as HTMLElement | null;
      if (event.target instanceof Node && !anchor?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [isApp, show, menuOpen]);

  if (!show) return null;

  const name = isApp
    ? (profile.data?.name ?? currentUser?.name ?? currentUser?.email ?? t("app.header.you"))
    : (account?.name ?? account?.email);
  const accountName = profile.data?.name?.trim() || currentUser?.name?.trim() || undefined;
  const photoURL = isApp ? (profile.data?.photoURL ?? undefined) : undefined;
  const unreadMessages = chat.data?.totalUnread ?? 0;
  const unreadNotifications = notifications.data?.count ?? 0;
  const active = activeNavKey(pathname);

  const menuVariant: AccountMenuVariant =
    variant === "app" ? "authed" : variant === "onboarding" ? "onboarding" : "guest";

  function goTo(key: NavKey, href: "/jobs" | "/messages" | "/curriculos" | "/profile"): void {
    if (active === key && (pathname === href || pathname.startsWith(`${href}/`))) return;
    router.push(href);
  }

  const landingInk = variant === "landing" ? "var(--landing-nav-ink, #17251c)" : undefined;
  const brand = (
    <NavBrand height={compact ? BRAND_HEIGHT_COMPACT : BRAND_HEIGHT} ink={landingInk} />
  );

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!isApp) return;
    if (event.key === "Escape") {
      setMenuOpen(false);
      event.currentTarget.querySelector<HTMLElement>("[data-account-trigger]")?.focus();
    }
    if (
      event.key === "ArrowDown" &&
      event.target instanceof HTMLElement &&
      event.target.hasAttribute("data-account-trigger")
    ) {
      event.preventDefault();
      setMenuOpen(true);
      requestAnimationFrame(() =>
        document.getElementById(menuId)?.querySelector<HTMLElement>("[role=menuitem]")?.focus(),
      );
    }
  };

  const controls = (
    <XStack alignItems="center" gap={isApp ? 8 : compact ? 6 : 12} flexShrink={0}>
      {isApp ? (
        <>
          <GlassCircleButton
            appearance="app"
            reducedMotion={reducedMotion}
            accessibilityLabel={t("app.header.messagesUnread", { count: unreadMessages })}
            active={active === "messages"}
            onPress={() => goTo("messages", "/messages")}
            badgeCount={unreadMessages}
            renderIcon={({ color, filled }) => (
              <NavGlyph name="messages" size={20} color={color} filled={filled} />
            )}
          />
          <GlassCircleButton
            appearance="app"
            reducedMotion={reducedMotion}
            accessibilityLabel={t("app.header.notificationsUnread", { count: unreadNotifications })}
            active={active === "notifications"}
            onPress={() => router.push("/notifications")}
            badgeCount={unreadNotifications}
            renderIcon={({ color, filled }) => (
              <NavGlyph name="notifications" size={20} color={color} filled={filled} />
            )}
          />
        </>
      ) : null}
      <YStack ref={menuAnchor} onKeyDown={onMenuKeyDown}>
        {isApp ? (
          <AccountTrigger
            name={accountName}
            open={menuOpen}
            menuId={menuId}
            onPress={() => setMenuOpen((open) => !open)}
          />
        ) : (
          <GlassCircleButton
            accessibilityLabel={t("landing.nav.openMenu")}
            expanded={menuOpen}
            onPress={() => setMenuOpen((open) => !open)}
            renderIcon={({ color }) => <StaggeredMenu size={20} color={color} strokeWidth={1.8} />}
          />
        )}
        {/* Keep the confirmation mounted when its originating menu closes. */}
        <AccountMenu
          open={menuOpen}
          menuId={menuId}
          anchorHeight={isApp ? NAV_CONTROL_SIZE_APP : NAV_CONTROL_SIZE}
          variant={menuVariant}
          identityLabel={name}
          photoURL={photoURL}
          onClose={() => setMenuOpen(false)}
          onOpenPreferences={setPrefsTab}
        />
      </YStack>
    </XStack>
  );

  const overlays = (
    <>
      {prefsTab !== null ? (
        <PreferencesModal tab={prefsTab} onTab={setPrefsTab} onClose={() => setPrefsTab(null)} />
      ) : null}
      {authOpen ? <AuthDialog onClose={() => setAuthOpen(false)} /> : null}
      {isApp ? <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );

  if (isApp) {
    const navPalette = appNavPalette[theme];
    return (
      <>
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          height={NAV_BAR_HEIGHT_APP}
          zIndex={100}
          backgroundColor={navPalette.background}
          data-app-navbar=""
          // @style-allow inline: web-only backdrop material; native headers use expo-blur
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <XStack
            width="100%"
            maxWidth={NAV_APP_MAX_WIDTH}
            marginHorizontal="auto"
            height={NAV_BAR_HEIGHT_APP}
            paddingHorizontal={tight ? 24 : 32}
            alignItems="center"
            gap={tight ? 28 : 44}
          >
            <YStack width={132} flexShrink={0}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Patch Careers"
                onPress={() => router.push("/jobs")}
              >
                <NavBrand height={40} />
              </Pressable>
            </YStack>
            <XStack flex={1} minWidth={0} alignItems="center" gap={tight ? 20 : 40}>
              <YStack flex={1} minWidth={0}>
                <SearchTrigger onPress={() => setSearchOpen(true)} active={searchOpen} inset />
              </YStack>
              <NavLinks
                active={active}
                tight={tight}
                name={name ?? t("app.header.you")}
                photoURL={photoURL}
              />
            </XStack>
            {controls}
          </XStack>
        </YStack>
        {/* Fixed overlays must sit outside the backdrop-filter containing block. */}
        {overlays}
      </>
    );
  }

  if (variant === "landing" && width >= 1024) {
    const green =
      theme === "dark" ? landingScrollPalette.navInkDark : landingScrollPalette.navInkLight;
    const landingChapters = LANDING_NAV_CHAPTERS;
    const showChapterNames = width >= 1180;
    return (
      <>
        <XStack
          tag="header"
          position="absolute"
          top={0}
          left={0}
          right={0}
          height={94}
          paddingHorizontal={Math.max(40, width * 0.083)}
          alignItems="center"
          justifyContent="space-between"
          zIndex={PUBLIC_Z_INDEX}
        >
          <YStack flex={1} alignItems="flex-start">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Patch Careers"
              onPress={() => navigateLandingChapter("hero")}
            >
              {brand}
            </Pressable>
          </YStack>
          <XStack
            tag="nav"
            aria-label={t("app.header.mainNavigation")}
            alignItems="center"
            gap={showChapterNames ? 7 : 3}
          >
            {landingChapters.map((chapter, index) => {
              const title = t(
                `landing.nav.${["intro", "context", "how", "scores", "start"][index]}`,
              );
              const number = String(index + 1).padStart(2, "0");
              const activeChapter = landingActiveChapter === chapter;
              return (
                <Button
                  key={chapter}
                  data-testid="landing-nav-chapter"
                  aria-label={`${number} · ${title}`}
                  aria-current={landingActiveChapter === chapter ? "step" : undefined}
                  onPress={() => {
                    setLandingActiveChapter(chapter);
                    navigateLandingChapter(chapter);
                  }}
                  backgroundColor={activeChapter ? `${green}18` : "transparent"}
                  borderWidth={0}
                  borderBottomWidth={activeChapter ? 2 : 0}
                  borderBottomColor={green}
                  paddingHorizontal={showChapterNames ? 3 : 5}
                  height={36}
                  fontFamily={landingSans}
                  fontSize={showChapterNames ? 9 : 10}
                  fontWeight={activeChapter ? "700" : "500"}
                  color={activeChapter ? green : (landingInk ?? palette.muted)}
                  hoverStyle={{ color: green, backgroundColor: "transparent" }}
                  focusVisibleStyle={{ outlineColor: green, outlineWidth: 2, outlineOffset: 4 }}
                >
                  {showChapterNames ? `${number} ${title}` : number}
                </Button>
              );
            })}
          </XStack>
          <XStack flex={1} justifyContent="flex-end" alignItems="center" gap={24}>
            <Button
              onPress={() => setAuthOpen(true)}
              backgroundColor="transparent"
              borderWidth={0}
              paddingHorizontal={4}
              height={46}
              fontFamily={landingSans}
              fontSize={13}
              fontWeight="600"
              color={landingInk ?? palette.body}
              hoverStyle={{ opacity: 0.7, backgroundColor: "transparent" }}
              focusVisibleStyle={{ outlineColor: green, outlineWidth: 2, outlineOffset: 4 }}
            >
              {t("landing.header.signIn")}
              <ArrowUpRight size={15} color={landingInk ?? palette.body} aria-hidden />
            </Button>
            <Button
              onPress={() => setAuthOpen(true)}
              height={46}
              minWidth={152}
              paddingHorizontal={20}
              justifyContent="space-between"
              borderRadius={6}
              borderWidth={0}
              backgroundColor="var(--landing-nav-button, #6e9053)"
              color="var(--landing-nav-button-ink, #ffffff)"
              fontFamily={landingSans}
              fontSize={13}
              fontWeight="600"
              hoverStyle={{ opacity: 0.9, backgroundColor: green }}
              focusVisibleStyle={{ outlineColor: green, outlineWidth: 2, outlineOffset: 4 }}
            >
              {t("landing.nav.getStarted")}
              <ArrowUpRight size={18} color="var(--landing-nav-button-ink, #ffffff)" aria-hidden />
            </Button>
          </XStack>
        </XStack>
        {overlays}
      </>
    );
  }

  return (
    <>
      <XStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={NAV_BAR_HEIGHT_PUBLIC}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={compact ? 16 : 28}
        zIndex={menuOpen ? PUBLIC_Z_INDEX_OPEN : PUBLIC_Z_INDEX}
      >
        {variant === "onboarding" ? (
          // Not a link mid-flow: clicking the mark would drop the visitor out
          // of onboarding onto the landing page.
          brand
        ) : (
          <Pressable accessibilityRole="link" onPress={() => router.push(localized("/"))}>
            {brand}
          </Pressable>
        )}

        {progress ? (
          // Takes the empty middle the CTA leaves behind, so the bar keeps the
          // landing's shape — mark hard left, hamburger hard right — and the
          // wizard's progress reads as the thing between them.
          <XStack flex={1} alignItems="center" gap={14} paddingHorizontal={compact ? 14 : 32}>
            <YStack
              flex={1}
              height={3}
              borderRadius={999}
              backgroundColor={palette.hairline}
              overflow="hidden"
            >
              {/* The onboarding progress follows the same green brand ink as
                  the landing and its auth surfaces. */}
              <YStack
                height="100%"
                width={`${Math.max(0, Math.min(100, progress.pct))}%`}
                backgroundColor={authDialogPalette[theme].brand}
                borderRadius={999}
              />
            </YStack>
            <Text fontFamily={landingSans} fontSize={13} color={palette.muted}>
              {progress.label}
            </Text>
          </XStack>
        ) : null}

        <XStack alignItems="center" gap={compact ? 6 : 10}>
          {variant === "landing" && !compact ? (
            <Pressable accessibilityRole="button" onPress={() => setAuthOpen(true)}>
              {/* Bare text, not a pill: the dialog it opens carries the
                  emphasis. */}
              <XStack paddingHorizontal={12} paddingVertical={10} hoverStyle={{ opacity: 0.7 }}>
                <Text
                  fontFamily={landingSans}
                  fontSize={15}
                  fontWeight="600"
                  color={landingInk ?? palette.ink}
                >
                  {t("auth.dialogMenuEntry")}
                </Text>
              </XStack>
            </Pressable>
          ) : null}

          {controls}
        </XStack>
      </XStack>

      {overlays}
    </>
  );
}
