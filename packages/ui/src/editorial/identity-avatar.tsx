/**
 * `IdentityAvatar` — the person, wearing the mark's own bezel.
 *
 * The account menu drew this inline (`nav-menu-panel`); the profile header
 * drew a different one (initials on a hashed hue). Two avatars for the same
 * human read as two different people, so the menu's version won and moved
 * here: the photo when there is one, a head-and-shoulders silhouette when
 * there is not — never initials — inside a bezel painted in the surface it
 * sits on, so it can overlap a banner and still cut a clean hole in it.
 */

import type { ReactElement } from "react";
import Svg, { Path } from "react-native-svg";
import { TStack } from "../internal/tamagui-shim";
import { useEditorialMenu } from "../internal/use-editorial-menu";
import { Avatar } from "../primitives/avatar";

/** A head and shoulders — the stand-in when there is no photo. */
const SILHOUETTE_HEAD = "M12 3.7a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Z";
const SILHOUETTE_BODY =
  "M12 15.2c-5.4 0-9.8 3.6-10.4 8.2-.1.9.6 1.6 1.5 1.6h17.8c.9 0 1.6-.7 1.5-1.6-.6-4.6-5-8.2-10.4-8.2Z";

export interface IdentityAvatarProps {
  readonly photoURL?: string | undefined;
  /** Used for the accessible label (and the photo's alt), never for initials. */
  readonly name: string;
  readonly size: number;
  /** Ring thickness; `0` drops the bezel entirely. */
  readonly bezel?: number;
  /** What the bezel is painted in — the colour of whatever sits behind it. */
  readonly bezelColor?: string | undefined;
  readonly accessibilityLabel?: string | undefined;
}

export function IdentityAvatar({
  photoURL,
  name,
  size,
  bezel = 0,
  bezelColor,
  accessibilityLabel,
}: IdentityAvatarProps): ReactElement {
  const menu = useEditorialMenu();

  const inner = photoURL ? (
    <Avatar
      src={photoURL}
      name={name}
      size={size}
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
    />
  ) : (
    <TStack
      width={size}
      height={size}
      borderRadius={999}
      backgroundColor={menu.avatarBg}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? name}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={SILHOUETTE_HEAD} fill={menu.avatarInk} />
        <Path d={SILHOUETTE_BODY} fill={menu.avatarInk} />
      </Svg>
    </TStack>
  );

  if (bezel <= 0) return inner;

  return (
    <TStack
      borderRadius={999}
      borderWidth={bezel}
      borderColor={bezelColor ?? "transparent"}
      overflow="hidden"
    >
      {inner}
    </TStack>
  );
}
