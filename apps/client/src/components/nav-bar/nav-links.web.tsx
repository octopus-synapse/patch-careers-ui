/**
 * The three primary desktop destinations.
 *
 * Active state is intentionally quiet: green ink, a filled glyph and one
 * short underline. Hover uses one short opacity/background transition.
 */

import { appNavPalette, editorialMenu } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, IdentityAvatar, useThemeName } from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { AppLink } from "@/navigation/app-link";
import { useI18n } from "@/providers/i18n-provider";
import { NAV_APP_TABS_WIDTH, NAV_APP_TABS_WIDTH_TIGHT } from "./nav-bar.contract";
import { NavGlyph } from "./nav-glyph.web";
import type { NavKey } from "./nav-routes";
import { useNavMedia } from "./use-nav-media.web";

const DESTINATIONS = [
  { key: "jobs", href: "/jobs", labelKey: "tabs.jobs" },
  { key: "applications", href: "/applications", labelKey: "tabs.applications" },
  { key: "curriculos", href: "/curriculos", labelKey: "tabs.resumes" },
  { key: "profile", href: "/profile", labelKey: "tabs.me" },
] as const;

export function NavLinks({
  active,
  tight,
  name,
  photoURL,
}: {
  readonly active: NavKey | null;
  readonly tight: boolean;
  readonly name: string;
  readonly photoURL: string | undefined;
}): ReactElement {
  const { t } = useI18n();
  const width = tight ? NAV_APP_TABS_WIDTH_TIGHT : NAV_APP_TABS_WIDTH;

  return (
    <XStack
      tag="nav"
      aria-label={t("app.header.mainNavigation")}
      width={width}
      flexShrink={0}
      height={64}
      alignItems="center"
    >
      {DESTINATIONS.map((item) => (
        <NavDestination
          key={item.key}
          item={item}
          focused={active === item.key}
          name={name}
          photoURL={photoURL}
        />
      ))}
    </XStack>
  );
}

function NavDestination({
  item,
  focused,
  name,
  photoURL,
}: {
  readonly item: (typeof DESTINATIONS)[number];
  readonly focused: boolean;
  readonly name: string;
  readonly photoURL: string | undefined;
}): ReactElement {
  const { t } = useI18n();
  const theme = useThemeName();
  const reduced = useNavMedia("(prefers-reduced-motion: reduce)");
  const forcedColors = useNavMedia("(forced-colors: active)");
  const [hovered, setHovered] = useState(false);
  const palette = appNavPalette[theme];
  const activeColor = forcedColors ? "Highlight" : palette.active;
  const restColor = forcedColors ? "LinkText" : palette.muted;
  const color = focused || hovered ? activeColor : restColor;
  const transition = reduced ? "none" : "color 140ms ease, background-color 140ms ease";

  return (
    <AppLink href={item.href} push asChild>
      <YStack
        tag="a"
        data-nav-key={item.key}
        aria-current={focused ? "page" : undefined}
        aria-label={
          item.key === "profile"
            ? `${t(item.labelKey)} — ${t("search.shortcuts.profile")}`
            : t(item.labelKey)
        }
        flex={1}
        flexBasis={0}
        minWidth={0}
        height={56}
        gap={4}
        paddingVertical={6}
        paddingHorizontal={6}
        alignItems="center"
        justifyContent="center"
        borderRadius={10}
        backgroundColor={hovered && !focused ? editorialMenu[theme].indigoSoft : "transparent"}
        cursor="pointer"
        style={{ textDecoration: "none", textDecorationLine: "none", color, transition }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        focusVisibleStyle={{
          outlineWidth: 2,
          outlineStyle: "solid",
          outlineColor: activeColor,
          outlineOffset: 3,
        }}
      >
        <YStack
          width={24}
          height={24}
          alignItems="center"
          justifyContent="center"
          aria-hidden="true"
        >
          {item.key === "profile" ? (
            <YStack
              borderRadius={999}
              borderWidth={focused ? 2 : 0}
              borderColor={activeColor}
              padding={focused ? 1 : 0}
            >
              <IdentityAvatar name={name} photoURL={photoURL} size={focused ? 20 : 24} />
            </YStack>
          ) : (
            <NavGlyph name={item.key} color={color} filled={focused} />
          )}
        </YStack>
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={12}
          lineHeight={16}
          fontWeight={focused ? "700" : "600"}
          color="inherit"
          numberOfLines={1}
        >
          {t(item.labelKey)}
        </Text>
        {focused ? (
          <YStack
            data-nav-active-line=""
            position="absolute"
            bottom={0}
            width={18}
            height={2}
            borderRadius={999}
            backgroundColor={activeColor}
            aria-hidden="true"
          />
        ) : null}
      </YStack>
    </AppLink>
  );
}
