import { appNavControl, appNavPalette, navControlRest } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useThemeName } from "@patch-careers/ui/editorial";
import { ChevronDown } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { NAV_CONTROL_SIZE_APP } from "./nav-bar.contract";
import { NavGlyph } from "./nav-glyph.web";
import { useNavMedia } from "./use-nav-media.web";

export function AccountTrigger({
  name,
  open,
  menuId,
  onPress,
}: {
  readonly name: string | undefined;
  readonly open: boolean;
  readonly menuId: string;
  readonly onPress: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = appNavPalette[useThemeName()];
  const reduced = useNavMedia("(prefers-reduced-motion: reduce)");
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const engaged = open || hovered || pressed;
  const color = engaged ? appNavControl.onFill : navControlRest.ink;
  const label = name?.trim().split(/\s+/)[0] || t("app.header.account");
  const transition = reduced
    ? "none"
    : "background-color 140ms ease, color 140ms ease, border-color 140ms ease";

  return (
    <XStack
      tag="button"
      type="button"
      data-account-trigger=""
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label={`${t("app.header.openAccountMenu")} — ${label}`}
      height={NAV_CONTROL_SIZE_APP}
      maxWidth={180}
      paddingHorizontal={14}
      gap={8}
      borderRadius={999}
      borderWidth={1}
      borderColor={engaged ? "transparent" : palette.hairlineStrong}
      backgroundColor={
        pressed ? appNavControl.pressed : engaged ? appNavControl.fill : navControlRest.bg
      }
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      focusVisibleStyle={{
        outlineColor: appNavControl.fill,
        outlineWidth: 2,
        outlineStyle: "solid",
        outlineOffset: 4,
      }}
      style={{ color, transition }}
    >
      <YStack
        width={22}
        height={22}
        borderRadius={999}
        overflow="hidden"
        flexShrink={0}
        backgroundColor={appNavControl.avatarBackground}
        aria-hidden="true"
      >
        <NavGlyph name="account" color={appNavControl.avatarInk} size={22} filled />
      </YStack>
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={13}
        lineHeight={18}
        fontWeight="600"
        minWidth={0}
        flexShrink={1}
        color="inherit"
        numberOfLines={1}
      >
        {label}
      </Text>
      <YStack
        marginLeft={2}
        opacity={0.65}
        aria-hidden="true"
        style={{
          transform: `rotate(${open ? 180 : 0}deg)`,
          transition: reduced ? "none" : "transform 140ms ease",
        }}
      >
        <ChevronDown size={13} color="currentColor" strokeWidth={2.5} />
      </YStack>
    </XStack>
  );
}
