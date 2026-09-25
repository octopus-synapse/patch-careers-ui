import { authDialogPalette } from "@patch-careers/tokens";
import { AuthCard, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { NAV_BAR_HEIGHT_PUBLIC } from "@/components/nav-bar/nav-bar.contract";

const DIALOG_PANEL_WIDTH = 550;
const DIALOG_PLAN_PANEL_WIDTH = 1260;
export const AUTH_PAGE_PANEL_WIDTH = 1260;
const AUTH_PAGE_FORM_PANEL_WIDTH = 700;
export const AUTH_PAGE_PANEL_HEIGHT = 680;
export const AUTH_PAGE_PANEL_PADDING_Y = 42;
export const AUTH_PAGE_PANEL_CONTENT_HEIGHT =
  AUTH_PAGE_PANEL_HEIGHT - 2 * AUTH_PAGE_PANEL_PADDING_Y - 2;
export const authPageMobilePanelHeight = (viewportHeight: number): number =>
  Math.max(440, Math.min(AUTH_PAGE_PANEL_HEIGHT, viewportHeight - NAV_BAR_HEIGHT_PUBLIC - 40));
export const authPageMobilePlanPanelHeight = (viewportHeight: number): number =>
  Math.max(440, viewportHeight);
export const authPagePlanPanelHeight = (viewportHeight: number): number =>
  Math.min(740, Math.max(320, viewportHeight - NAV_BAR_HEIGHT_PUBLIC - 24));

export function AuthFlowPanel({
  children,
  variant = "dialog",
  isPlanStep = false,
  mobileTransparent = false,
  contentPlacement = "center",
  header,
}: {
  readonly children: ReactNode;
  readonly variant?: "dialog" | "page";
  readonly isPlanStep?: boolean;
  readonly mobileTransparent?: boolean;
  readonly contentPlacement?: "center" | "upper";
  readonly header?: ReactNode;
}): ReactElement {
  const { width, height } = useWindowDimensions();
  const dialogPalette = authDialogPalette[useThemeName()];
  const isPage = variant === "page";
  const transparentMobile = mobileTransparent && width < 600;
  const transparentPlanPage = isPage && isPlanStep && width >= 600;
  const transparentPanel = transparentMobile || transparentPlanPage;
  const paddingTop = isPlanStep ? 22 : isPage ? AUTH_PAGE_PANEL_PADDING_Y : width < 600 ? 25 : 30;
  const paddingBottom = isPlanStep ? 22 : isPage ? AUTH_PAGE_PANEL_PADDING_Y : 35;
  const panelHeight = isPage
    ? width < 600
      ? isPlanStep
        ? authPageMobilePlanPanelHeight(height)
        : authPageMobilePanelHeight(height)
      : isPlanStep
        ? authPagePlanPanelHeight(height)
        : AUTH_PAGE_PANEL_HEIGHT
    : isPlanStep
      ? Math.min(780, height * 0.96)
      : Math.min(620, height * 0.94);

  return (
    <AuthCard
      animateIn
      panelStyle={{
        width: "100%",
        alignSelf: "center",
        maxWidth: isPage
          ? isPlanStep
            ? AUTH_PAGE_PANEL_WIDTH
            : AUTH_PAGE_FORM_PANEL_WIDTH
          : isPlanStep
            ? DIALOG_PLAN_PANEL_WIDTH
            : DIALOG_PANEL_WIDTH,
        height: panelHeight,
        backgroundColor: transparentPanel ? "transparent" : dialogPalette.panel,
        borderRadius: 17,
        borderWidth: transparentPanel ? 0 : 1,
        borderColor: dialogPalette.panelBorder,
        paddingHorizontal: transparentPlanPage
          ? 0
          : width < 600
            ? isPlanStep
              ? 16
              : 25
            : isPlanStep
              ? 24
              : isPage
                ? 44
                : 35,
        paddingTop,
        paddingBottom,
      }}
    >
      <View
        style={{
          width: "100%",
          height: panelHeight - paddingTop - paddingBottom - (transparentPanel ? 0 : 2),
        }}
      >
        {header ? <View style={{ height: isPlanStep ? 46 : 76 }}>{header}</View> : null}
        {isPlanStep && width < 600 ? (
          children
        ) : (
          <ScrollView
            key={isPlanStep ? "plans" : "form"}
            // @style-allow inline: native ScrollView requires viewport sizing through the style prop
            style={{ width: "100%", flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent:
                (isPlanStep && width < 800) || contentPlacement === "upper"
                  ? "flex-start"
                  : "center",
              paddingTop: contentPlacement === "upper" ? (height < 600 ? 36 : 72) : 0,
            }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )}
      </View>
    </AuthCard>
  );
}
