/**
 * WebNavBar — the desktop-web top navigation bar (LinkedIn shape, Editorial
 * Calm material).
 *
 * On web at the desktop breakpoint this single bar replaces BOTH pieces of the
 * mobile chrome: the AppHeader (avatar · search · bell) and the bottom
 * EditorialTabBar. One centered cluster (capped at BAR_MAX_WIDTH): brand
 * lockup, global search, then the destinations as
 * icon-over-sentence-case-label columns — active = ink + filled glyph + a
 * 2px underline riding the bar's bottom edge — and the
 * account folded into a LinkedIn-style "Eu" tab (mini avatar + caret) that
 * opens the MeMenu dropdown (view profile / settings / sign out) instead of
 * the mobile ProfileMenu drawer.
 *
 * Rendered once in the root layout, ABOVE the router Stack, so it persists
 * across tab switches and stacked pushes (job detail, settings…) like a real
 * web app shell. It self-gates: renders nothing on native, below the desktop
 * breakpoint, while signed out, or on screens that own the full window (auth,
 * onboarding, standalone flows). Navigation state comes from the URL
 * (`usePathname`), not from the tab navigator, precisely so it can live
 * outside the navigators it fronts.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  useGetV1ChatUnread,
  useGetV1NotificationsUnreadCount,
  useGetV1UsersProfile,
} from "@patch-careers/api-client";
import { Avatar, Text, XStack, YStack } from "@patch-careers/ui";
import { BrandLockup, CountBadge, useEditorialPalette } from "@patch-careers/ui/editorial";
import { usePathname, useRouter } from "expo-router";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { SearchModal, SearchTrigger } from "@/features/search";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { MeMenu } from "./me-menu";

// Bar row height — taller than the mobile AppHeader's 56 so the full brand
// lockup (mark + wordmark) breathes at the left edge.
const BAR_HEIGHT = 72;
// The lockup's render height inside the bar.
const LOCKUP_HEIGHT = 48;
// Fixed column per destination — sized for the widest label
// ("Notificações") at the 13px label size.
const NAV_ITEM_WIDTH = 96;
// The search pill sits between two equal flex spacers, so it has one fixed
// width instead of a flex range.
const SEARCH_WIDTH = 360;
// The row is a centered cluster, not edge-pinned: logo and destinations stay
// close to the search instead of hugging the window corners.
const BAR_MAX_WIDTH = 1200;

type IoniconName = keyof typeof Ionicons.glyphMap;
type NavKey = "jobs" | "messages" | "curriculos" | "notifications" | "profile";

// Screens that own the full window keep the navbar off; everything else in
// the authed app shows it (tab roots AND stacked details, LinkedIn-style).
const CHROMELESS_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/2fa-verify",
  "/reset-password",
  "/oauth-callback",
  "/onboarding",
  "/fit-questionnaire",
  "/legal-webview",
] as const;

function isChromePath(pathname: string): boolean {
  if (pathname === "/") return false;
  return !CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Stacked details keep their section lit (job detail → Vagas, a conversation
// → Mensagens…), mirroring how the web reads "where am I" off the URL.
function activeNavKey(pathname: string): NavKey | null {
  if (pathname.startsWith("/jobs") || pathname.startsWith("/job/")) return "jobs";
  if (pathname.startsWith("/messages") || pathname.startsWith("/conversation")) return "messages";
  if (pathname.startsWith("/curriculos") || pathname.startsWith("/resume")) return "curriculos";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

function glyph(outline: IoniconName, filled: IoniconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : outline} color={color} size={size} />
  );
}

/**
 * One destination column: glyph over a sentence-case label, hover lifts muted
 * → ink, active = ink + filled glyph (caller-chosen) + a 2px underline pinned
 * to the bar's bottom edge. Local to the web bar on purpose — the mobile
 * bottom bar keeps the shared small-caps `TabBarItem` untouched.
 */
function WebNavItem({
  label,
  focused,
  onPress,
  renderIcon,
  badge,
  trailing,
  accessibilityLabel,
}: {
  label: string;
  focused: boolean;
  onPress: () => void;
  renderIcon: (args: { focused: boolean; color: string; size: number }) => ReactNode;
  badge?: ReactNode;
  /** Rendered after the label (the "Eu" caret). Receives the resolved color. */
  trailing?: (color: string) => ReactNode;
  accessibilityLabel?: string;
}): ReactElement {
  const palette = useEditorialPalette();
  const [hovered, setHovered] = useState(false);
  const color = focused || hovered ? palette.ink : palette.muted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <YStack
        width={NAV_ITEM_WIDTH}
        height={BAR_HEIGHT}
        alignItems="center"
        justifyContent="center"
        gap={4}
      >
        {/* Fixed-height glyph band so an avatar glyph never shifts baselines;
            a tight relative wrapper anchors the corner badge. */}
        <YStack height={26} alignItems="center" justifyContent="center">
          <YStack position="relative">
            {renderIcon({ focused, color, size: 24 })}
            {badge}
          </YStack>
        </YStack>
        <XStack alignItems="center" gap={3}>
          <Text fontSize={13} lineHeight={16} color={color} numberOfLines={1}>
            {label}
          </Text>
          {trailing ? trailing(color) : null}
        </XStack>
        <YStack
          position="absolute"
          bottom={0}
          left={16}
          right={16}
          height={2}
          borderRadius={1}
          backgroundColor={palette.ink}
          opacity={focused ? 1 : 0}
        />
      </YStack>
    </Pressable>
  );
}

export function WebNavBar(): ReactElement | null {
  const isDesktopWeb = useIsDesktopWeb();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const { currentUser, isAuthenticated } = useAuthState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Anchor wrapper around the "Eu" tab + its dropdown: outside-click dismissal
  // checks containment against this node (on web the ref IS the DOM element).
  const meWrapRef = useRef<View | null>(null);

  const show =
    isDesktopWeb &&
    isAuthenticated &&
    !currentUser?.needsEmailVerification &&
    isChromePath(pathname);

  const profile = useGetV1UsersProfile({ query: { enabled: show } });
  const chat = useGetV1ChatUnread({ query: { enabled: show, refetchInterval: 30_000 } });
  const notifications = useGetV1NotificationsUnreadCount({
    query: { enabled: show, refetchInterval: 30_000 },
  });

  // Close the dropdown on any click outside its anchor, or on Escape — the
  // web-native dismissal pattern a popover needs and a Modal would fight.
  useEffect(() => {
    if (!menuOpen || typeof document === "undefined") return;
    const onDocPointerDown = (event: MouseEvent): void => {
      const node = meWrapRef.current as unknown as HTMLElement | null;
      if (node && event.target instanceof Node && node.contains(event.target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (!show) return null;

  const photoURL = profile.data?.photoURL ?? undefined;
  const name = profile.data?.name ?? currentUser?.name ?? currentUser?.email ?? t("app.header.you");
  const unreadMessages = chat.data?.totalUnread ?? 0;
  const unreadNotifications = notifications.data?.count ?? 0;
  const active = activeNavKey(pathname);

  function goTo(
    key: NavKey,
    href: "/jobs" | "/messages" | "/curriculos" | "/notifications" | "/profile",
  ): void {
    if (active === key && (pathname === href || pathname.startsWith(`${href}/`))) return;
    router.push(href);
  }

  return (
    <XStack
      backgroundColor={palette.surface}
      borderBottomWidth={1}
      borderBottomColor={palette.hairline}
      justifyContent="center"
      // Above the router Stack (a later sibling), so the MeMenu dropdown
      // hanging below the bar paints over scene content.
      zIndex={100}
    >
      <XStack
        width="100%"
        maxWidth={BAR_MAX_WIDTH}
        height={BAR_HEIGHT}
        paddingHorizontal={24}
        alignItems="center"
      >
        {/* Brand lockup opens the row and acts as "home" — it re-enters the
            Vagas tab. Web-only by construction: this whole bar renders
            exclusively on desktop web. */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Patch Careers"
          onPress={() => router.push("/jobs")}
        >
          <BrandLockup height={LOCKUP_HEIGHT} />
        </Pressable>

        <XStack flex={1} />

        {/* Global search — same trigger + command palette as mobile. The two
            equal spacers keep it balanced between logo and destinations, all
            three reading as one centered cluster. */}
        <XStack width={SEARCH_WIDTH}>
          <YStack flex={1}>
            <SearchTrigger onPress={() => setSearchOpen(true)} active={searchOpen} inset />
          </YStack>
        </XStack>

        <XStack flex={1} />

        {/* Destination columns sit flush (each column already breathes);
            the outer gap separates the cluster from the search pill. */}
        <XStack>
          <WebNavItem
            label={t("tabs.jobs")}
            focused={active === "jobs"}
            onPress={() => goTo("jobs", "/jobs")}
            renderIcon={glyph("briefcase-outline", "briefcase")}
          />
          <WebNavItem
            label={t("tabs.messages")}
            focused={active === "messages"}
            onPress={() => goTo("messages", "/messages")}
            renderIcon={glyph("chatbubble-ellipses-outline", "chatbubble-ellipses")}
            badge={<CountBadge count={unreadMessages} />}
            accessibilityLabel={
              unreadMessages > 0
                ? t("app.header.messagesUnread", { count: unreadMessages })
                : t("tabs.messages")
            }
          />
          <WebNavItem
            label={t("tabs.resumes")}
            focused={active === "curriculos"}
            onPress={() => goTo("curriculos", "/curriculos")}
            renderIcon={glyph("documents-outline", "documents")}
          />
          <WebNavItem
            label={t("app.header.notifications")}
            focused={active === "notifications"}
            onPress={() => goTo("notifications", "/notifications")}
            renderIcon={glyph("notifications-outline", "notifications")}
            badge={<CountBadge count={unreadNotifications} />}
            accessibilityLabel={
              unreadNotifications > 0
                ? t("app.header.notificationsUnread", { count: unreadNotifications })
                : t("app.header.notifications")
            }
          />

          {/* "Eu" — the Perfil destination and the account menu folded into
              one LinkedIn-style tab: mini avatar + caret, dropdown below. */}
          {/* RN's default position is relative — this plain View is both the
              dropdown's containing block and the outside-click boundary. */}
          <View ref={meWrapRef}>
            <WebNavItem
              label={t("tabs.me")}
              focused={active === "profile" || menuOpen}
              onPress={() => setMenuOpen((prev) => !prev)}
              accessibilityLabel={t("app.header.openAccountMenu")}
              renderIcon={({ size }) => <Avatar src={photoURL} name={name} size={size} />}
              trailing={(color) => (
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={color}
                  // Caret flips while the dropdown is open.
                  style={{ transform: [{ rotate: menuOpen ? "180deg" : "0deg" }] }}
                />
              )}
            />
            <MeMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              name={name}
              headline={profile.data?.headline ?? undefined}
              photoURL={photoURL}
            />
          </View>
        </XStack>
      </XStack>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </XStack>
  );
}
