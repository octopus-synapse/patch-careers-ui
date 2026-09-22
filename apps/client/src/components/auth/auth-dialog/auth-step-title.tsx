import { authDialogPalette } from "@patch-careers/tokens";
import { Text } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { useWindowDimensions } from "react-native";

type TitleVariant = "hero" | "plan" | "standard" | "centered" | "notice" | "success";

/** Shared title color and type scale for every step of the auth flow. */
export function AuthStepTitle({
  children,
  variant = "standard",
  isPage = false,
  centered = false,
}: {
  readonly children: ReactNode;
  readonly variant?: TitleVariant;
  readonly isPage?: boolean;
  readonly centered?: boolean;
}): ReactElement {
  const brandColor = authDialogPalette[useThemeName()].brand;
  const inkColor = useEditorialPalette().ink;
  const { width } = useWindowDimensions();
  const displayTitle = variant === "hero" || variant === "plan";
  const serif = displayTitle || variant === "notice";
  const fontSize = displayTitle
    ? isPage
      ? 48
      : 40
    : variant === "notice"
      ? 27
      : variant === "success"
        ? isPage && width >= 600
          ? 38
          : 34
        : variant === "centered"
          ? 34
          : isPage
            ? 44
            : 38;
  const lineHeight = displayTitle
    ? isPage
      ? 51
      : 43
    : variant === "notice"
      ? 32
      : variant === "success"
        ? isPage && width >= 600
          ? 42
          : 38
        : variant === "centered"
          ? 38
          : isPage
            ? 48
            : 41;

  return (
    <Text
      fontFamily={serif ? editorialFonts.serif : editorialFonts.sans}
      fontSize={fontSize}
      lineHeight={lineHeight}
      fontWeight={variant === "plan" ? "700" : serif ? "400" : "600"}
      letterSpacing={
        variant === "notice" ? -0.4 : serif ? -1.2 : variant === "centered" ? -1.4 : -1.7
      }
      textAlign={centered || variant === "centered" || variant === "notice" ? "center" : "left"}
      color={displayTitle ? inkColor : brandColor}
    >
      {children}
    </Text>
  );
}
