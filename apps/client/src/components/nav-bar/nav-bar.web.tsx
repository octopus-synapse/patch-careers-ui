/**
 * `NavBar` — the one top bar the web wears, in four variants.
 *
 * It used to be two components with two visual languages: a signed-in bar with
 * a capped centre cluster and its own dropdown, and a public overlay bar with
 * another. They are one now: the mascot at the left, the same circular glass
 * controls at the right, and the same menu panel hanging off the hamburger on
 * every page. What still differs is only what belongs to each surface —
 *
 *   · `landing`    — the "Entrar ou criar conta" CTA, opening the
 *     identifier-first dialog in place.
 *   · `auth`       — sign-in and sign-up: no CTA. You are already there; a
 *     button pointing at the page you are on is furniture.
 *   · `onboarding` — signed in, no profile yet. The wizard's progress fills the
 *     middle and the mark stops being a link out of the flow.
 *   · `app`        — the shell: search, three destinations, the messages and
 *     notifications controls carrying their unread counts, and the account
 *     menu.
 *
 * The `app` variant is mounted once in the root layout, ABOVE the router Stack,
 * so it persists across tab switches and stacked pushes like a real web app
 * shell; it self-gates on breakpoint, auth and route. The other three are
 * rendered by the screens that own them.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  useGetV1ChatUnread,
  useGetV1NotificationsUnreadCount,
  useGetV1UsersProfile,
} from "@patch-careers/api-client";
import { landingAccentPalettes } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  BrandFace,
  FrostedFill,
  IdentityAvatar,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { usePathname, useRouter } from "expo-router";
import { Bell, Menu, MessageCircle } from "lucide-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { AuthDialog } from "@/components/auth/auth-dialog/auth-dialog";
import { landingSans } from "@/features/landing";
import { SearchModal, SearchTrigger } from "@/features/search";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useDismissOnOutside } from "@/hooks/use-dismiss-on-outside";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { AccountMenu, type AccountMenuVariant } from "./account-menu";
import { GlassCircleButton } from "./glass-circle-button";
import {
  NAV_BAR_HEIGHT_APP,
  NAV_BAR_HEIGHT_PUBLIC,
  NAV_CLUSTER_GAP,
  NAV_SEARCH_WIDTH,
  NAV_SEARCH_WIDTH_TIGHT,
  NAV_TAB_GAP,
  type NavAccount,
  type NavBarVariant,
  type NavProgress,
} from "./nav-bar.contract";
import { activeNavKey, isChromePath, type NavKey } from "./nav-routes";
import { NavTabItem } from "./nav-tab-item";
import { PreferencesModal, type PreferencesTab } from "./preferences-modal";

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

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * A destination glyph: a real outline/solid PAIR, swapped on focus.
 *
 * This used to be one lucide icon with `fill={color}` painted over it, and it
 * could not work: lucide is a stroke-only set, so filling `FileText` gave a
 * solid black page (its text lines are strokes in the same colour, drawn on top
 * of the fill) and `Briefcase` a solid block. Ionicons draws its solid variants
 * as their own shapes, with the inner detail cut OUT of the fill — which is the
 * whole point of a filled active state.
 *
 * So the bar's destinations are Ionicons while its controls (bell, hamburger,
 * magnifier) and the menu's rows stay lucide. That split is deliberate: the
 * controls are outline-only and never fill, so the two families never sit in
 * the same state next to each other — and the mobile tab bar already pairs
 * these exact Ionicons (`app/(tabs)/_layout.tsx`), so the two bars now light up
 * with the same glyphs.
 */
function glyph(outline: IoniconName, filled: IoniconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    // Solid reads heavier than outline at the same size; a point back keeps the
    // two states the same optical weight in the 24px glyph band.
    <Ionicons name={focused ? filled : outline} color={color} size={focused ? size - 1 : size} />
  );
}

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [prefsTab, setPrefsTab] = useState<PreferencesTab | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  // Anchor wrapper around the hamburger + its panel: outside-click dismissal
  // checks containment against this node (on web the ref IS the DOM element).
  const menuAnchor = useRef<View | null>(null);

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

  // The search pill advertises ⌘K, so the shortcut has to exist.
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

  if (!show) return null;

  const name = isApp
    ? (profile.data?.name ?? currentUser?.name ?? currentUser?.email ?? t("app.header.you"))
    : (account?.name ?? account?.email);
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

  const brand = <BrandFace height={compact ? BRAND_HEIGHT_COMPACT : BRAND_HEIGHT} />;

  // The cluster is centred on the viewport, so the space it leaves for the mark
  // and the controls is (width - cluster) / 2. Three columns cost 304, so the
  // cluster is `search + 334`; the busier right side needs ~186 (padding plus
  // the three circles). At 1024 the wide pill would leave it 160 — hence the
  // tight size below 1200, which still lands ~200 a side.
  const searchWidth = width < 1200 ? NAV_SEARCH_WIDTH_TIGHT : NAV_SEARCH_WIDTH;

  const controls = (
    <XStack alignItems="center" gap={compact ? 6 : 12}>
      {/* Messages sits with the controls, not in the cluster: it is somewhere
          you check, not one of the app's destinations. Same circle as the bell
          beside it — an inbox and a notification tray are the same kind of
          thing, and they should look it. */}
      {isApp ? (
        <GlassCircleButton
          accessibilityLabel={
            unreadMessages > 0
              ? t("app.header.messagesUnread", { count: unreadMessages })
              : t("tabs.messages")
          }
          active={active === "messages"}
          onPress={() => goTo("messages", "/messages")}
          badgeCount={unreadMessages}
          renderIcon={({ color }) => <MessageCircle size={18} color={color} strokeWidth={1.8} />}
        />
      ) : null}

      {isApp ? (
        <GlassCircleButton
          accessibilityLabel={
            unreadNotifications > 0
              ? t("app.header.notificationsUnread", { count: unreadNotifications })
              : t("app.header.notifications")
          }
          active={active === "notifications"}
          onPress={() => router.push("/notifications")}
          badgeCount={unreadNotifications}
          renderIcon={({ color }) => <Bell size={18} color={color} strokeWidth={1.8} />}
        />
      ) : null}

      {/* RN Views default to position:relative — the panel anchors here, and
          this same node is the outside-click boundary. */}
      <View ref={menuAnchor}>
        <GlassCircleButton
          accessibilityLabel={t("landing.nav.openMenu")}
          expanded={menuOpen}
          onPress={() => setMenuOpen((open) => !open)}
          renderIcon={({ color }) => <Menu size={18} color={color} strokeWidth={1.8} />}
        />

        {menuOpen ? (
          <AccountMenu
            variant={menuVariant}
            identityLabel={name}
            photoURL={photoURL}
            onClose={() => setMenuOpen(false)}
            onOpenPreferences={setPrefsTab}
          />
        ) : null}
      </View>
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
    return (
      <XStack
        // Floats OVER the scene rather than sitting above it in flow, so the
        // page's content slides under the frosted bar as you scroll — which is
        // the only condition under which frosted glass reads as glass. Every
        // scrolling screen pays for this with `useNavBarInset()` on its content.
        position="absolute"
        top={0}
        left={0}
        right={0}
        borderBottomWidth={1}
        borderBottomColor={palette.hairline}
        height={NAV_BAR_HEIGHT_APP}
        paddingHorizontal={36}
        alignItems="center"
        // Over the scene, and over the menu panel's own siblings.
        zIndex={100}
      >
        {/* The material itself: blur plus a wash of the page colour. First
            child so everything else paints on top of it. */}
        <FrostedFill variant="glass" />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Patch Careers"
          onPress={() => router.push("/jobs")}
        >
          {brand}
        </Pressable>

        <XStack flex={1} />
        {controls}

        {/* The cluster is centred in the BAR, which spans the viewport, so it
            is centred on screen without a percentage transform. It floats over
            the row; `box-none` lets the brand and the controls stay clickable
            in the margins it covers. */}
        <XStack
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          alignItems="center"
          justifyContent="center"
          gap={NAV_CLUSTER_GAP}
          pointerEvents="box-none"
        >
          <XStack width={searchWidth}>
            <YStack flex={1}>
              <SearchTrigger onPress={() => setSearchOpen(true)} active={searchOpen} inset />
            </YStack>
          </XStack>

          <XStack gap={NAV_TAB_GAP}>
            <NavTabItem
              label={t("tabs.jobs")}
              focused={active === "jobs"}
              onPress={() => goTo("jobs", "/jobs")}
              renderIcon={glyph("briefcase-outline", "briefcase")}
            />
            <NavTabItem
              label={t("tabs.resumes")}
              focused={active === "curriculos"}
              onPress={() => goTo("curriculos", "/curriculos")}
              renderIcon={glyph("document-text-outline", "document-text")}
            />
            {/* "Eu" is a destination now, not a menu: the account moved into
                the hamburger, so this goes straight to the profile. */}
            <NavTabItem
              label={t("tabs.me")}
              focused={active === "profile"}
              onPress={() => goTo("profile", "/profile")}
              renderIcon={({ focused, size }) => (
                // The avatar IS the glyph, so "active" cannot be a fill. It
                // becomes an ink ring laid INSIDE the circle's own bounds, so
                // the column's glyph band keeps its width either way.
                <YStack width={size} height={size}>
                  <IdentityAvatar
                    photoURL={photoURL}
                    name={name ?? t("app.header.you")}
                    size={size}
                  />
                  {focused ? (
                    <YStack
                      position="absolute"
                      top={0}
                      right={0}
                      bottom={0}
                      left={0}
                      borderRadius={999}
                      borderWidth={2}
                      borderColor={palette.ink}
                      pointerEvents="none"
                    />
                  ) : null}
                </YStack>
              )}
            />
          </XStack>
        </XStack>

        {overlays}
      </XStack>
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
              {/* Brand indigo, not ink: the one horizontal line of colour in
                  the flow, and it is the brand doing the counting. */}
              <YStack
                height="100%"
                width={`${Math.max(0, Math.min(100, progress.pct))}%`}
                backgroundColor={landingAccentPalettes[theme].indigo.accent}
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
                <Text fontFamily={landingSans} fontSize={15} fontWeight="600" color={palette.ink}>
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
