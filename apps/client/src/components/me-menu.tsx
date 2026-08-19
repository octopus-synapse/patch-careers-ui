/**
 * MeMenu — the desktop-web account dropdown anchored under the navbar's "Eu"
 * tab (LinkedIn "Me" shape, Editorial Calm material).
 *
 * A paper panel (not the mobile drawer): profile card (avatar · serif name ·
 * headline), an accent-outline "Ver meu perfil" pill, then the same shortcuts
 * the mobile ProfileMenu drawer carries — Configurações and Sair da conta —
 * separated by hairlines. Sign-out stays gated behind the shared editorial
 * ConfirmDialog; unlike the drawer there is no Modal-stacking dance because
 * the popover is a plain absolutely-positioned view.
 *
 * Purely presentational + navigation: the parent (WebNavBar) owns the open
 * state, the anchor wrapper and the outside-click/Escape dismissal.
 */

import { logout } from "@patch-careers/auth";
import { Avatar, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { type Href, useRouter } from "expo-router";
import { ChevronRight, LogOut, Settings } from "lucide-react-native";
import { type ComponentType, type ReactElement, useState } from "react";
import { Pressable } from "react-native";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";
import { ConfirmDialog } from "./confirm-dialog";

const MENU_WIDTH = 304;
// Below the anchor tab: the navbar row's 56 plus an 8px gap.
const MENU_TOP = 64;

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

function MenuRow({
  icon: Icon,
  label,
  onPress,
  danger = false,
}: {
  icon: Glyph;
  label: string;
  onPress: () => void;
  danger?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const [hovered, setHovered] = useState(false);
  const tint = danger ? palette.danger : palette.body;
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        backgroundColor: pressed || hovered ? palette.bg : "transparent",
      })}
    >
      <XStack alignItems="center" gap={12} paddingHorizontal={16} height={40}>
        <Icon size={17} color={tint} strokeWidth={1.75} />
        <Text fontSize={13} color={tint} flex={1}>
          {label}
        </Text>
        {danger ? null : <ChevronRight size={15} color={palette.subtle} strokeWidth={1.75} />}
      </XStack>
    </Pressable>
  );
}

export type MeMenuProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  headline?: string | undefined;
  photoURL?: string | undefined;
};

export function MeMenu({ open, onClose, name, headline, photoURL }: MeMenuProps): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const router = useRouter();
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [viewHovered, setViewHovered] = useState(false);

  const go = (path: Href): void => {
    onClose();
    router.push(path);
  };

  const performLogout = async (): Promise<void> => {
    setConfirmOpen(false);
    await logout();
    // The (tabs) gate redirects on the store reset; replace makes it immediate.
    router.replace(AUTH_SIGN_IN_ROUTE);
  };

  return (
    <>
      {open ? (
        <YStack
          position="absolute"
          top={MENU_TOP}
          right={0}
          width={MENU_WIDTH}
          backgroundColor={palette.panel}
          borderWidth={1}
          borderColor={palette.hairline}
          borderRadius={16}
          overflow="hidden"
          zIndex={100}
          accessibilityRole="menu"
          accessibilityLabel={t("app.header.openAccountMenu")}
          // RNW maps this to box-shadow; the soft drop is what separates the
          // panel from the page in both schemes.
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 28,
            shadowOpacity: theme === "dark" ? 0.5 : 0.14,
          }}
        >
          {/* Profile card */}
          <YStack padding={16} paddingBottom={14} gap={14}>
            <XStack gap={12} alignItems="flex-start">
              <Avatar src={photoURL} name={name} size="lg" />
              <YStack flex={1} paddingTop={2} gap={4}>
                <Text
                  fontFamily={editorialFonts.serif}
                  fontSize={17}
                  lineHeight={22}
                  color={palette.ink}
                  numberOfLines={2}
                >
                  {name}
                </Text>
                {headline ? (
                  <Text fontSize={12.5} lineHeight={17} color={palette.body} numberOfLines={2}>
                    {headline}
                  </Text>
                ) : null}
              </YStack>
            </XStack>
            <Pressable
              accessibilityRole="menuitem"
              accessibilityLabel={t("profile.menu.viewProfileOfA11y", { name })}
              onPress={() => go("/profile")}
              onHoverIn={() => setViewHovered(true)}
              onHoverOut={() => setViewHovered(false)}
              style={({ pressed }) => ({
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: palette.accent,
                alignItems: "center",
                justifyContent: "center",
                // Accent wash on hover/press — the palette is opaque hex, so
                // the wash is the accent with an alpha suffix.
                backgroundColor: pressed || viewHovered ? `${palette.accent}1F` : "transparent",
              })}
            >
              <Text fontSize={13} fontWeight="600" color={palette.accent}>
                {t("profile.menu.viewProfile")}
              </Text>
            </Pressable>
          </YStack>

          <YStack height={1} backgroundColor={palette.hairline} />

          <YStack paddingVertical={6}>
            <MenuRow
              icon={Settings}
              label={t("profile.menu.settings")}
              onPress={() => go("/settings")}
            />
          </YStack>

          <YStack height={1} backgroundColor={palette.hairline} />

          <YStack paddingVertical={6}>
            <MenuRow
              icon={LogOut}
              label={t("profile.menu.signOut")}
              danger
              onPress={() => {
                onClose();
                setConfirmOpen(true);
              }}
            />
          </YStack>
        </YStack>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        danger
        icon={LogOut}
        title={t("profile.menu.signOutConfirm.title")}
        description={t("profile.menu.signOutConfirm.description")}
        confirmLabel={t("profile.menu.signOutConfirm.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void performLogout()}
      />
    </>
  );
}
