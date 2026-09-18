/**
 * `NavMenuPanel` — the dropdown the hamburger opens, on every surface
 * (`docs/design/menu-final.html`).
 *
 * Two puzzle pieces interlock across the banner, and the avatar overlaps the
 * seam from below wearing a panel-coloured bezel — the mark's own idea, applied
 * to the person. Under it, an identity line and then the rows. Both pieces now
 * come from `@patch-careers/ui/editorial` (`PuzzleBanner` / `IdentityAvatar`),
 * because the profile page wears the same two.
 *
 * The identity is what the four surfaces differ on: the app shows the name, the
 * onboarding wizard shows the e-mail (there is no profile yet), and the public
 * pages show a silhouette under a "Visitante" badge — the geometry stays
 * identical across all three, so the panel does not jump when you sign in.
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  editorialFonts,
  IdentityAvatar,
  PuzzleBanner,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { MENU_PANEL_OFFSET, MENU_PANEL_WIDTH, NAV_CONTROL_SIZE } from "./nav-bar.contract";

const PANEL_PADDING = 10;
const BANNER_HEIGHT = 84;
const AVATAR = 68;
const AVATAR_BEZEL = 4;
/** How far the avatar rides up over the banner. */
const AVATAR_OVERLAP = 38;

export type NavMenuIdentity =
  | { readonly kind: "guest"; readonly label: string }
  | { readonly kind: "person"; readonly label: string; readonly photoURL?: string | undefined };

export function NavMenuPanel({
  identity,
  menuId,
  anchorHeight = NAV_CONTROL_SIZE,
  accessibilityLabel,
  children,
}: {
  readonly identity: NavMenuIdentity;
  readonly menuId?: string | undefined;
  readonly anchorHeight?: number | undefined;
  readonly accessibilityLabel: string;
  /** The rows and their separators. */
  readonly children: ReactNode;
}): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();

  return (
    <YStack
      id={menuId}
      position="absolute"
      top={anchorHeight + MENU_PANEL_OFFSET}
      right={0}
      width={MENU_PANEL_WIDTH}
      padding={PANEL_PADDING}
      backgroundColor={palette.panel}
      borderWidth={1}
      borderColor={palette.hairline}
      borderRadius={20}
      overflow="hidden"
      zIndex={100}
      accessibilityRole="menu"
      accessibilityLabel={accessibilityLabel}
      // RNW maps this to box-shadow; the soft drop is what separates the panel
      // from the page in both schemes.
      style={{
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 18 },
        shadowRadius: 36,
        shadowOpacity: theme === "dark" ? 0.5 : 0.16,
      }}
    >
      <YStack marginTop={-PANEL_PADDING} marginHorizontal={-PANEL_PADDING}>
        <PuzzleBanner height={BANNER_HEIGHT} topRadius={10} />
      </YStack>

      <YStack
        alignItems="center"
        marginTop={-AVATAR_OVERLAP}
        paddingHorizontal={12}
        paddingBottom={16}
        gap={9}
      >
        <IdentityAvatar
          photoURL={identity.kind === "person" ? identity.photoURL : undefined}
          name={identity.label}
          size={AVATAR}
          bezel={AVATAR_BEZEL}
          bezelColor={palette.panel}
        />

        {identity.kind === "guest" ? (
          // A badge, not a name: it has to read as "nobody is signed in".
          <XStack
            paddingHorizontal={10}
            paddingVertical={4}
            borderRadius={999}
            borderWidth={1}
            borderColor={palette.hairline}
          >
            <Text fontFamily={editorialFonts.mono} fontSize={11} color={palette.muted}>
              {identity.label}
            </Text>
          </XStack>
        ) : (
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={20}
            lineHeight={26}
            fontWeight="400"
            color={palette.ink}
            numberOfLines={1}
          >
            {identity.label}
          </Text>
        )}
      </YStack>

      {children}
    </YStack>
  );
}

/** The panel's hairline rule. `low` is the tighter one above the sign-out row. */
export function NavMenuSeparator({ low = false }: { readonly low?: boolean }): ReactElement {
  const palette = useEditorialPalette();
  return (
    <YStack
      height={1}
      backgroundColor={palette.hairline}
      marginHorizontal={8}
      marginTop={low ? 7 : 4}
      marginBottom={7}
    />
  );
}
