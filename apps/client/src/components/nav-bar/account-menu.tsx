/**
 * `AccountMenu` — the panel's contents, which is the only thing that differs
 * between the four surfaces the navbar serves.
 *
 *   · `guest`      (landing, sign-in, sign-up) — preferences only. Signing in
 *     is the bar's own CTA, so putting it in here too would say it twice.
 *   · `onboarding` — the e-mail stands in for the name (there is no profile
 *     yet) and Settings is withheld: it is not a place to wander off to
 *     mid-flow. Leaving is still allowed.
 *   · `authed`     — the full set.
 *
 * Sign-out goes through the shared editorial `ConfirmDialog` in every variant
 * that offers it. The onboarding menu used to sign out unconfirmed; losing a
 * half-finished wizard to a stray click is exactly what the dialog is for.
 */

import { logout } from "@patch-careers/auth";
import { type Href, useRouter } from "expo-router";
import { Globe, LogOut, Moon, Settings, Sun } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useColorSchemeStore, useResolvedScheme } from "@/providers/color-scheme";
import { useI18n } from "@/providers/i18n-provider";
import { ConfirmDialog } from "../confirm-dialog";
import { NavMenuPanel, NavMenuSeparator } from "./nav-menu-panel";
import { NavMenuRow } from "./nav-menu-row";
import type { PreferencesTab } from "./preferences-modal";

export type AccountMenuVariant = "guest" | "onboarding" | "authed";

export type AccountMenuProps = {
  readonly variant: AccountMenuVariant;
  /** The name (`authed`) or the e-mail (`onboarding`). Ignored for `guest`. */
  readonly identityLabel?: string | undefined;
  readonly photoURL?: string | undefined;
  readonly onClose: () => void;
  readonly onOpenPreferences: (tab: PreferencesTab) => void;
};

export function AccountMenu({
  variant,
  identityLabel,
  photoURL,
  onClose,
  onOpenPreferences,
}: AccountMenuProps): ReactElement {
  const { t, locale } = useI18n();
  const router = useRouter();
  const scheme = useColorSchemeStore((store) => store.scheme);
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
    router.replace(AUTH_SIGN_IN_ROUTE);
  };

  return (
    <>
      <NavMenuPanel
        accessibilityLabel={t("app.header.openAccountMenu")}
        identity={
          variant === "guest"
            ? { kind: "guest", label: t("app.menu.guest") }
            : { kind: "person", label: identityLabel ?? t("app.header.you"), photoURL }
        }
      >
        <NavMenuSeparator />

        <NavMenuRow
          icon={Globe}
          label={t("landing.nav.langRegion")}
          value={locale}
          flourish={{ y: -1.5 }}
          onPress={() => {
            onClose();
            onOpenPreferences("lang");
          }}
        />

        <NavMenuRow
          // The glyph shows the scheme you are IN, matching the prototype.
          icon={resolved === "dark" ? Moon : Sun}
          label={t("landing.nav.theme")}
          value={t(`profile.menu.theme.${scheme}`)}
          flourish={{ rotate: -8 }}
          onPress={() => {
            onClose();
            onOpenPreferences("theme");
          }}
        />

        {variant === "authed" ? (
          <NavMenuRow
            icon={Settings}
            label={t("profile.menu.settings")}
            flourish={{ rotate: 60 }}
            onPress={() => go("/settings")}
          />
        ) : null}

        {canSignOut ? (
          <>
            <NavMenuSeparator low />
            <NavMenuRow
              icon={LogOut}
              label={t("profile.menu.signOut")}
              flourish={{ x: 2.5 }}
              danger
              onPress={() => {
                onClose();
                setConfirmOpen(true);
              }}
            />
          </>
        ) : null}
      </NavMenuPanel>

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
