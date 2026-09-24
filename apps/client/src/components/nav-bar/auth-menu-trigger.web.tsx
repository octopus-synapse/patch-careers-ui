import { authDialogPalette } from "@patch-careers/tokens";
import { XStack } from "@patch-careers/ui";
import { useThemeName } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";
import {
  AUTH_MENU_ICON_COLOR,
  AUTH_MENU_ICON_SIZE,
  AUTH_MENU_RADIUS,
  AUTH_MENU_SIZE,
  AUTH_MENU_STROKE_WIDTH,
} from "./auth-nav-style";
import { StaggeredMenu } from "./staggered-menu";

/** Compact auth menu trigger shared visually with the native auth header. */
export function AuthMenuTrigger({
  open,
  menuId,
  onPress,
}: {
  readonly open: boolean;
  readonly menuId: string;
  readonly onPress: () => void;
}): ReactElement {
  const { t } = useI18n();
  const theme = useThemeName();
  const palette = authDialogPalette[theme];

  return (
    <XStack
      tag="button"
      type="button"
      aria-label={t(open ? "landing.nav.close" : "landing.nav.openMenu")}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onPress={onPress}
      width={AUTH_MENU_SIZE}
      height={AUTH_MENU_SIZE}
      borderRadius={open ? 999 : AUTH_MENU_RADIUS}
      borderWidth={0}
      backgroundColor="transparent"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      focusVisibleStyle={{ outlineColor: palette.brand, outlineWidth: 2, outlineStyle: "solid" }}
    >
      {open ? (
        <X size={24} color={AUTH_MENU_ICON_COLOR[theme]} strokeWidth={2.3} aria-hidden />
      ) : (
        <StaggeredMenu
          size={AUTH_MENU_ICON_SIZE}
          color={AUTH_MENU_ICON_COLOR[theme]}
          strokeWidth={AUTH_MENU_STROKE_WIDTH}
          aria-hidden
        />
      )}
    </XStack>
  );
}
