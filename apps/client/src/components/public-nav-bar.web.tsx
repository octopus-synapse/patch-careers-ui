/**
 * `PublicNavBar` — the public pages' chrome on web (landing, sign-in,
 * sign-up), Airbnb-pattern: brand mark left; right side is a text CTA +
 * a circular hamburger opening a dropdown card (icon rows + dividers +
 * a featured mascot row on the auth pages), and language/theme live one
 * level deeper in a centred modal with tabs — language cells switch via
 * `useLocaleSwitch` (persist + twin-route replace), theme cards write
 * the color-scheme store.
 *
 * Overlay bar (transparent, height 76, zIndex 40) — inside the landing
 * it renders under the BootOverlay (100) and beside the ChapterRail
 * (50); on the auth screens it floats over the AuthShell paper.
 * Compact under 480px: smaller mark, tighter padding.
 */

import { Ionicons } from "@expo/vector-icons";
import { logout } from "@patch-careers/auth";
import { editorialOverlays, editorialPalettes, landingAccentPalettes } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { AuthDialog } from "@/components/auth/auth-dialog/auth-dialog";
import { BrandFace, landingSans } from "@/features/landing";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { useColorSchemeStore, useResolvedScheme } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";
import {
  PUBLIC_NAV_BAR_HEIGHT,
  type PublicNavAccount,
  type PublicNavCta,
  type PublicNavProgress,
} from "./public-nav-bar.contract";

export {
  PUBLIC_NAV_BAR_HEIGHT,
  type PublicNavAccount,
  type PublicNavCta,
  type PublicNavProgress,
} from "./public-nav-bar.contract";

const BAR_HEIGHT = PUBLIC_NAV_BAR_HEIGHT;
const COMPACT_BREAKPOINT = 480;
/** Under the ChapterRail (50) and the BootOverlay (100) on the landing. */
const BAR_Z_INDEX = 40;
const MENU_WIDTH = 270;
const MODAL_MAX_WIDTH = 720;

type ModalTab = "lang" | "theme";

export function PublicNavBar({
  cta,
  progress,
  account,
}: {
  readonly cta: PublicNavCta;
  readonly progress?: PublicNavProgress;
  readonly account?: PublicNavAccount;
}): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const router = useRouter();
  const localized = useLocalizedHref();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
  const resolvedScheme = useResolvedScheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const menuWrapRef = useRef<View | null>(null);

  // On the landing the auth entries open the unified dialog in place
  // (identifier-first); on the auth pages they keep navigating between
  // the standalone screens, which remain the deep-link/URL surface.
  const unifiedAuth = cta === "landing";
  // Signed-in variant: the visitor already has an account, so the CTA goes and
  // the brand stops being a link out of the flow.
  const onboarding = cta === "onboarding";

  // Close the dropdown on any click outside its anchor, or on Escape — the
  // web-native dismissal pattern a popover needs (same as the MeMenu's).
  useEffect(() => {
    if (!menuOpen || typeof document === "undefined") return;
    const onDocPointerDown = (event: MouseEvent): void => {
      const node = menuWrapRef.current as unknown as HTMLElement | null;
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

  const ctaLabel = cta === "signUp" ? t("landing.header.signIn") : t("landing.header.signUp");
  const ctaTarget = cta === "signUp" ? "/(auth)/sign-in" : "/(auth)/sign-up";

  return (
    <>
      <XStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={BAR_HEIGHT}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={compact ? 16 : 28}
        zIndex={BAR_Z_INDEX}
      >
        {onboarding ? (
          // Not a link mid-flow: clicking the mark would drop the visitor out
          // of onboarding onto the landing page.
          <BrandFace height={compact ? 40 : 54} />
        ) : (
          <Pressable accessibilityRole="link" onPress={() => router.push(localized("/"))}>
            <BrandFace height={compact ? 40 : 54} />
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
                backgroundColor={landingAccentPalettes[resolvedScheme].indigo.accent}
                borderRadius={999}
              />
            </YStack>
            <Text fontFamily={landingSans} fontSize={13} color={palette.muted}>
              {progress.label}
            </Text>
          </XStack>
        ) : null}

        <XStack alignItems="center" gap={compact ? 6 : 10}>
          {!compact && !onboarding && (
            <Pressable
              accessibilityRole="link"
              onPress={() => (unifiedAuth ? setAuthOpen(true) : router.push(localized(ctaTarget)))}
            >
              {unifiedAuth ? (
                // On the landing the CTA is bare text (Airbnb-calm) — the
                // dialog it opens carries the emphasis, not a pill.
                <XStack paddingHorizontal={12} paddingVertical={10} hoverStyle={{ opacity: 0.7 }}>
                  <Text fontFamily={landingSans} fontSize={15} fontWeight="600" color={palette.ink}>
                    {ctaLabel}
                  </Text>
                </XStack>
              ) : (
                <XStack
                  backgroundColor={palette.primary}
                  borderRadius={999}
                  paddingHorizontal={20}
                  paddingVertical={10}
                  hoverStyle={{ backgroundColor: palette.primaryPress }}
                >
                  <Text
                    fontFamily={landingSans}
                    fontSize={15}
                    fontWeight="600"
                    color={palette.onPrimary}
                  >
                    {ctaLabel}
                  </Text>
                </XStack>
              )}
            </Pressable>
          )}

          {/* RN Views default to position:relative — the dropdown anchors here. */}
          <View ref={menuWrapRef}>
            <CircleButton
              accessibilityLabel={t("landing.nav.openMenu")}
              expanded={menuOpen}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Ionicons name="menu" size={18} color={palette.ink} />
            </CircleButton>

            {menuOpen && (
              <PublicMenu
                cta={cta}
                {...(account ? { account } : {})}
                onNavigate={(path) => {
                  setMenuOpen(false);
                  if (unifiedAuth && path !== "/") {
                    setAuthOpen(true);
                    return;
                  }
                  router.push(localized(path));
                }}
                onOpenModal={(tab) => {
                  setMenuOpen(false);
                  setModalTab(tab);
                }}
              />
            )}
          </View>
        </XStack>
      </XStack>

      {modalTab !== null && (
        <PreferencesModal tab={modalTab} onTab={setModalTab} onClose={() => setModalTab(null)} />
      )}

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </>
  );
}

function CircleButton({
  children,
  onPress,
  accessibilityLabel,
  expanded,
}: {
  readonly children: ReactNode;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly expanded?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
    >
      <YStack
        width={42}
        height={42}
        borderRadius={999}
        backgroundColor={expanded ? palette.hairline : palette.surface}
        hoverStyle={{ backgroundColor: palette.hairline }}
        alignItems="center"
        justifyContent="center"
      >
        {children}
      </YStack>
    </Pressable>
  );
}

/** The Airbnb dropdown card: icon rows, dividers, featured mascot row. */
function PublicMenu({
  cta,
  account,
  onNavigate,
  onOpenModal,
}: {
  readonly cta: PublicNavCta;
  readonly account?: PublicNavAccount;
  readonly onNavigate: (path: "/" | "/(auth)/sign-in" | "/(auth)/sign-up") => void;
  readonly onOpenModal: (tab: ModalTab) => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const resolved = useResolvedScheme();

  return (
    <YStack
      position="absolute"
      top={54}
      right={0}
      width={MENU_WIDTH}
      backgroundColor={palette.panel}
      borderRadius={16}
      borderWidth={1}
      borderColor={palette.hairline}
      paddingVertical={8}
      zIndex={60}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 20,
        shadowOpacity: resolved === "dark" ? 0.5 : 0.12,
      }}
    >
      <MenuRow
        icon={<Ionicons name="language-outline" size={16} color={palette.ink} />}
        label={t("landing.nav.langRegion")}
        onPress={() => onOpenModal("lang")}
      />
      <MenuRow
        icon={
          <Ionicons
            name={resolved === "dark" ? "sunny-outline" : "moon-outline"}
            size={16}
            color={palette.ink}
          />
        }
        label={t("landing.nav.theme")}
        onPress={() => onOpenModal("theme")}
      />
      <Divider />
      {cta !== "landing" && !account && (
        <>
          <Pressable accessibilityRole="link" onPress={() => onNavigate("/")}>
            <XStack
              alignItems="center"
              gap={12}
              paddingHorizontal={18}
              paddingVertical={12}
              backgroundColor={palette.surface}
              hoverStyle={{ backgroundColor: palette.hairline }}
            >
              <YStack flex={1} gap={2}>
                <Text fontFamily={landingSans} fontSize={14} fontWeight="500" color={palette.ink}>
                  {t("landing.nav.seeDemo")}
                </Text>
                <Text fontFamily={landingSans} fontSize={12} color={palette.muted}>
                  {t("landing.nav.seeDemoSub")}
                </Text>
              </YStack>
              <BrandFace height={27} />
            </XStack>
          </Pressable>
          <Divider />
        </>
      )}
      {account ? (
        <AccountSection account={account} />
      ) : cta === "landing" ? (
        // One unified entry — the identifier-first dialog decides between
        // sign-in and sign-up, so the menu shouldn't pre-split the choice.
        <MenuRow
          label={t("auth.dialogMenuEntry")}
          bold
          onPress={() => onNavigate("/(auth)/sign-in")}
        />
      ) : (
        <>
          <MenuRow
            label={t("landing.header.signIn")}
            onPress={() => onNavigate("/(auth)/sign-in")}
          />
          <MenuRow
            label={t("landing.header.signUp")}
            bold
            onPress={() => onNavigate("/(auth)/sign-up")}
          />
        </>
      )}
    </YStack>
  );
}

/**
 * Who you are, in the one menu the onboarding flow exposes. Deliberately
 * quieter than the app's `MeMenu` profile card: mid-onboarding there is no
 * photo and often no name yet, so this shows the initial on a grey disc and
 * the e-mail that identifies the account — enough to answer "am I signed in,
 * and as whom?" without pretending to be a profile.
 */
function AccountSection({ account }: { readonly account: PublicNavAccount }): ReactElement {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const router = useRouter();
  const initial = (account.name ?? account.email).trim().charAt(0).toUpperCase();

  const signOut = async (): Promise<void> => {
    await logout();
    // Signing out drops `hasCompletedOnboarding`, so the onboarding gate would
    // bounce anyway — replace makes it immediate instead of a flash of wizard.
    router.replace(AUTH_SIGN_IN_ROUTE);
  };

  return (
    <>
      <XStack alignItems="center" gap={12} paddingHorizontal={18} paddingVertical={10}>
        <YStack
          width={32}
          height={32}
          borderRadius={999}
          backgroundColor={palette.hairline}
          alignItems="center"
          justifyContent="center"
        >
          <Text fontFamily={landingSans} fontSize={13} fontWeight="600" color={palette.muted}>
            {initial}
          </Text>
        </YStack>
        <YStack flex={1} gap={1}>
          <Text fontFamily={landingSans} fontSize={12} color={palette.muted}>
            {t("profile.menu.signedInAs")}
          </Text>
          <Text
            fontFamily={landingSans}
            fontSize={13.5}
            color={palette.ink}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {account.email}
          </Text>
        </YStack>
      </XStack>
      <Divider />
      <MenuRow
        icon={<Ionicons name="log-out-outline" size={16} color={palette.ink} />}
        label={t("profile.menu.signOut")}
        onPress={() => {
          void signOut();
        }}
      />
    </>
  );
}

function MenuRow({
  icon,
  label,
  sublabel,
  bold,
  onPress,
}: {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly sublabel?: string;
  readonly bold?: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <XStack
        alignItems="center"
        gap={12}
        paddingHorizontal={18}
        paddingVertical={12}
        backgroundColor="transparent"
        hoverStyle={{ backgroundColor: palette.surface }}
      >
        {icon}
        <YStack gap={2}>
          <Text
            fontFamily={landingSans}
            fontSize={14}
            fontWeight={bold ? "600" : "400"}
            color={palette.ink}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text fontFamily={landingSans} fontSize={12} color={palette.muted}>
              {sublabel}
            </Text>
          ) : null}
        </YStack>
      </XStack>
    </Pressable>
  );
}

function Divider(): ReactElement {
  const palette = useEditorialPalette();
  return <YStack height={1} backgroundColor={palette.hairline} marginVertical={8} />;
}

/** The centred "Language & region / Theme" modal, Airbnb-shaped. */
function PreferencesModal({
  tab,
  onTab,
  onClose,
}: {
  readonly tab: ModalTab;
  readonly onTab: (tab: ModalTab) => void;
  readonly onClose: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const { t, locale } = useI18n();
  const scheme = useColorSchemeStore((store) => store.scheme);
  const setScheme = useColorSchemeStore((store) => store.setScheme);
  const resolved = useResolvedScheme();
  const localeSwitch = useLocaleSwitch();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const langs = [
    { value: "pt-BR" as const, label: t("landing.nav.langPt"), sub: t("landing.nav.langPtRegion") },
    { value: "en" as const, label: t("landing.nav.langEn"), sub: t("landing.nav.langEnRegion") },
  ];
  const themes = [
    { value: "light" as const, label: t("profile.menu.theme.light") },
    { value: "dark" as const, label: t("profile.menu.theme.dark") },
    {
      value: "system" as const,
      label: t("profile.menu.theme.system"),
      sub: t("landing.nav.systemHint"),
    },
  ];

  return (
    <View
      style={{
        // Escapes the landing's stacking context on purpose — the modal
        // covers the page like the Airbnb one. RNW passes `fixed` through.
        position: "fixed" as never,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 300,
        backgroundColor: editorialOverlays[resolved].scrimModal,
        alignItems: "center",
        justifyContent: "center",
      }}
      onStartShouldSetResponder={() => true}
      onResponderRelease={onClose}
      {...{ dataSet: { landingOverlay: "" } }}
    >
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => undefined}
        style={{ width: Math.min(MODAL_MAX_WIDTH, width * 0.92), maxHeight: height * 0.88 }}
      >
        <YStack
          backgroundColor={palette.panel}
          borderRadius={30}
          borderWidth={1}
          borderColor={palette.hairline}
          paddingHorizontal={30}
          paddingTop={16}
          paddingBottom={34}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 30 },
            shadowRadius: 80,
            shadowOpacity: resolved === "dark" ? 0.6 : 0.24,
          }}
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor={palette.hairline}
            marginTop={2}
          >
            <XStack gap={24}>
              <ModalTabButton
                label={t("landing.nav.langRegion")}
                active={tab === "lang"}
                onPress={() => onTab("lang")}
              />
              <ModalTabButton
                label={t("landing.nav.theme")}
                active={tab === "theme"}
                onPress={() => onTab("theme")}
              />
            </XStack>
            <CircleClose onPress={onClose} label={t("landing.nav.close")} />
          </XStack>

          {tab === "lang" ? (
            <>
              <XStack
                alignItems="center"
                gap={16}
                backgroundColor={palette.surface}
                borderRadius={14}
                borderWidth={1}
                borderColor={palette.hairline}
                paddingHorizontal={18}
                paddingVertical={16}
                marginTop={22}
              >
                <YStack flex={1} gap={2}>
                  <Text
                    fontFamily={landingSans}
                    fontSize={14.5}
                    fontWeight="500"
                    color={palette.ink}
                  >
                    {t("landing.nav.translateTitle")}
                  </Text>
                  <Text fontFamily={landingSans} fontSize={13} color={palette.muted}>
                    {t("landing.nav.translateSub")}
                  </Text>
                </YStack>
                <BrandFace height={27} />
              </XStack>
              <Text
                fontSize={19}
                fontWeight="600"
                color={palette.ink}
                marginTop={26}
                marginBottom={16}
              >
                {t("landing.nav.suggested")}
              </Text>
              <XStack gap={10} flexWrap="wrap">
                {langs.map((lang) => (
                  <ModalCell
                    key={lang.value}
                    active={locale === lang.value}
                    onPress={() => {
                      onClose();
                      localeSwitch(lang.value);
                    }}
                  >
                    <Text fontFamily={landingSans} fontSize={14} color={palette.ink}>
                      {lang.label}
                    </Text>
                    <Text fontFamily={landingSans} fontSize={13} color={palette.muted}>
                      {lang.sub}
                    </Text>
                  </ModalCell>
                ))}
              </XStack>
            </>
          ) : (
            <>
              {/* The active tab already says "Theme" — no section heading. */}
              <XStack gap={10} flexWrap="wrap" marginTop={26}>
                {themes.map((theme) => (
                  <ModalCell
                    key={theme.value}
                    active={scheme === theme.value}
                    onPress={() => setScheme(theme.value)}
                  >
                    <ThemeSwatch kind={theme.value} />
                    <Text fontFamily={landingSans} fontSize={14} color={palette.ink} marginTop={10}>
                      {theme.label}
                    </Text>
                    {theme.sub ? (
                      <Text fontFamily={landingSans} fontSize={13} color={palette.muted}>
                        {theme.sub}
                      </Text>
                    ) : null}
                  </ModalCell>
                ))}
              </XStack>
            </>
          )}
        </YStack>
      </View>
    </View>
  );
}

function CircleClose({
  onPress,
  label,
}: {
  readonly onPress: () => void;
  readonly label: string;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <YStack
        width={34}
        height={34}
        borderRadius={999}
        alignItems="center"
        justifyContent="center"
        marginLeft={-8}
        backgroundColor="transparent"
        hoverStyle={{ backgroundColor: palette.surface }}
      >
        <Ionicons name="close" size={17} color={palette.ink} />
      </YStack>
    </Pressable>
  );
}

function ModalTabButton({
  label,
  active,
  onPress,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress}>
      <YStack paddingTop={12} paddingBottom={14} position="relative">
        <Text
          fontFamily={landingSans}
          fontSize={14.5}
          fontWeight="500"
          color={active ? palette.ink : palette.muted}
        >
          {label}
        </Text>
        {active && (
          <YStack
            position="absolute"
            left={0}
            right={0}
            bottom={-1}
            height={2}
            backgroundColor={palette.ink}
          />
        )}
      </YStack>
    </Pressable>
  );
}

function ModalCell({
  children,
  active,
  onPress,
}: {
  readonly children: ReactNode;
  readonly active: boolean;
  readonly onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <YStack
        minWidth={150}
        borderRadius={14}
        borderWidth={1}
        borderColor={active ? palette.ink : palette.hairline}
        backgroundColor="transparent"
        hoverStyle={
          active
            ? undefined
            : { backgroundColor: palette.surface, borderColor: palette.hairlineStrong }
        }
        paddingHorizontal={14}
        paddingVertical={12}
        gap={2}
      >
        {children}
      </YStack>
    </Pressable>
  );
}

/**
 * Theme preview cards show BOTH palettes side by side, so the swatches
 * deliberately read the static `editorialPalettes` map instead of the
 * theme-resolved hook — a "dark" swatch must stay dark in light mode.
 */
function ThemeSwatch({ kind }: { readonly kind: "light" | "dark" | "system" }): ReactElement {
  const light = editorialPalettes.light;
  const dark = editorialPalettes.dark;
  const serif = (color: string): ReactElement => (
    <Text position="absolute" top={6} left={10} fontSize={19} color={color} fontFamily="$serif">
      Aa
    </Text>
  );
  return (
    <XStack
      height={56}
      borderRadius={9}
      borderWidth={1}
      borderColor={useEditorialPalette().hairlineStrong}
      overflow="hidden"
    >
      {kind !== "dark" && (
        <YStack flex={1} backgroundColor={light.bg} position="relative">
          {kind === "light" && serif(light.ink)}
        </YStack>
      )}
      {kind !== "light" && (
        <YStack flex={1} backgroundColor={dark.bg} position="relative">
          {kind === "dark" && serif(dark.ink)}
        </YStack>
      )}
    </XStack>
  );
}
