import { useAppRouter } from "@/navigation/use-app-router";
/**
 * `AccountMenu` — the panel's contents, which is the only thing that differs
 * between the four surfaces the navbar serves.
 *
 *   · `guest`      (landing, sign-in, sign-up) — preferences only. Signing in
 *     is the bar's own CTA, so putting it in here too would say it twice.
 *   · `onboarding` — the e-mail stands in for the name (there is no profile
 *     yet). It keeps the public help/legal rows but withholds Settings: it is
 *     not a place to wander off to mid-flow. Leaving is still allowed.
 *   · `authed`     — the full set.
 *
 * Sign-out goes through the shared editorial `ConfirmDialog` in every variant
 * that offers it. The onboarding menu used to sign out unconfirmed; losing a
 * half-finished wizard to a stray click is exactly what the dialog is for.
 */

import { logout } from "@patch-careers/auth";
import { YStack } from "@patch-careers/ui";
import type { Href } from "expo-router";
import {
  CircleHelp,
  FileText,
  Globe,
  LockKeyhole,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react-native";
import { Fragment, type ReactElement, useState } from "react";
import { AUTH_ROUTE } from "@/navigation/auth-redirect";
import { useResolvedScheme } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";
import { ConfirmDialog } from "../confirm-dialog";
import { NavMenuPanel, NavMenuSeparator } from "./nav-menu-panel";
import { NavMenuRow, type NavMenuRowProps } from "./nav-menu-row";
import type { PreferencesTab } from "./preferences-modal";

export type AccountMenuVariant = "guest" | "onboarding" | "authed";

export type AccountMenuProps = {
  readonly variant: AccountMenuVariant;
  readonly open?: boolean;
  readonly menuId?: string;
  readonly anchorHeight?: number;
  readonly fullscreen?: boolean;
  readonly showAuthLinks?: boolean;
  /** The name (`authed`) or the e-mail (`onboarding`). Ignored for `guest`. */
  readonly identityLabel?: string | undefined;
  readonly photoURL?: string | undefined;
  readonly onClose: () => void;
  readonly onOpenPreferences: (tab: PreferencesTab) => void;
};

export function AccountMenu({
  variant,
  open = true,
  menuId,
  anchorHeight,
  fullscreen = false,
  showAuthLinks = false,
  identityLabel,
  photoURL,
  onClose,
  onOpenPreferences,
}: AccountMenuProps): ReactElement {
  const { t } = useI18n();
  const router = useAppRouter();
  const resolved = useResolvedScheme();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canSignOut = variant !== "guest";

  const go = (path: Href): void => {
    onClose();
    router.push(path);
  };

  const performLogout = async (): Promise<void> => {
    setConfirmOpen(false);
    await logout();
    // The route gates redirect on the store reset; replace makes it immediate.
    router.replace(AUTH_ROUTE);
  };

  const openLegal = (kind: "privacy" | "terms"): void => {
    onClose();
    window.open(`https://patchcareers.org/${kind}`, "_blank", "noopener,noreferrer");
  };

  const rows: Array<NavMenuRowProps & { key: string; separatorBefore?: boolean }> = [
    {
      key: "language",
      icon: Globe,
      label: t("landing.nav.langRegion"),
      onPress: () => {
        onClose();
        onOpenPreferences("lang");
      },
    },
    {
      key: "theme",
      // The glyph shows the scheme currently in use.
      icon: resolved === "dark" ? Moon : Sun,
      label: t("landing.nav.theme"),
      onPress: () => {
        onClose();
        onOpenPreferences("theme");
      },
    },
  ];

  if (showAuthLinks) {
    rows.push(
      { key: "help", icon: CircleHelp, label: t("landing.nav.help"), disabled: true },
      {
        key: "privacy",
        icon: LockKeyhole,
        label: t("landing.nav.privacy"),
        onPress: () => openLegal("privacy"),
      },
      {
        key: "terms",
        icon: FileText,
        label: t("landing.nav.termsOfUse"),
        onPress: () => openLegal("terms"),
      },
    );
  }

  if (variant === "authed") {
    rows.push({
      key: "settings",
      icon: Settings,
      label: t("profile.menu.settings"),
      onPress: () => go("/settings"),
    });
  }

  const signOutRow: NavMenuRowProps | undefined = canSignOut
    ? {
        icon: LogOut,
        label: t("profile.menu.signOut"),
        danger: true,
        onPress: () => {
          onClose();
          setConfirmOpen(true);
        },
      }
    : undefined;

  return (
    <>
      {open ? (
        <NavMenuPanel
          menuId={menuId}
          anchorHeight={anchorHeight}
          fullscreen={fullscreen}
          accessibilityLabel={t("app.header.openAccountMenu")}
          identity={
            variant === "guest"
              ? { kind: "guest", label: t("app.menu.guest") }
              : { kind: "person", label: identityLabel ?? t("app.header.you"), photoURL }
          }
        >
          {fullscreen ? (
            <>
              <YStack flex={1} justifyContent="center">
                {rows.map(({ key, ...row }, index) => (
                  <NavMenuRow key={key} {...row} fullscreen first={index === 0} />
                ))}
              </YStack>
              {signOutRow ? <NavMenuRow {...signOutRow} fullscreen /> : null}
            </>
          ) : (
            <>
              <NavMenuSeparator />
              {rows.map(({ key, separatorBefore, ...row }) => (
                <Fragment key={key}>
                  {separatorBefore ? <NavMenuSeparator low /> : null}
                  <NavMenuRow {...row} />
                </Fragment>
              ))}
              {signOutRow ? (
                <Fragment>
                  <NavMenuSeparator low />
                  <NavMenuRow {...signOutRow} />
                </Fragment>
              ) : null}
            </>
          )}
        </NavMenuPanel>
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
