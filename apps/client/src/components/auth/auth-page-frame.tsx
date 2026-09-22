import { authDialogPalette } from "@patch-careers/tokens";
import { AuthShell, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import {
  AUTH_PAGE_PANEL_HEIGHT,
  AUTH_PAGE_PANEL_WIDTH,
  authPageMobilePanelHeight,
  authPageMobilePlanPanelHeight,
  authPagePlanPanelHeight,
} from "@/components/auth/auth-dialog/auth-flow-panel";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { NAV_BAR_HEIGHT_PUBLIC } from "@/components/nav-bar/nav-bar.contract";

/** Full-bleed frame shared by auth and password reset. */
export function AuthPageFrame({
  children,
  plan = false,
  showHeader = false,
}: {
  readonly children: ReactNode;
  readonly plan?: boolean;
  readonly showHeader?: boolean;
}): ReactElement {
  const { width, height } = useWindowDimensions();
  const pageColor = authDialogPalette[useThemeName()].panel;
  const compact = width < 600;
  const panelHeight = compact
    ? plan
      ? authPageMobilePlanPanelHeight(height)
      : authPageMobilePanelHeight(height)
    : plan
      ? authPagePlanPanelHeight(height)
      : AUTH_PAGE_PANEL_HEIGHT;
  const scale =
    Platform.OS === "web" && !compact
      ? Math.min(1, Math.max(0.1, (height - NAV_BAR_HEIGHT_PUBLIC - 32) / panelHeight))
      : 1;
  const panelWidth = compact
    ? width - 32
    : Math.min(AUTH_PAGE_PANEL_WIDTH, (width * (plan ? 0.96 : 0.92)) / scale);

  return (
    <View style={{ flex: 1 }}>
      <AuthShell
        variant="card"
        showEra={false}
        backgroundColor={pageColor}
        // The compact plan step owns its own scroller so its action bar can
        // remain pinned to the viewport. A second, outer ScrollView intercepts
        // wheel/touch input and lets that action bar fall below the fold.
        scrollEnabled={Platform.OS !== "web" || (compact && !plan)}
      >
        <View
          style={{
            width: panelWidth * scale,
            height: panelHeight * scale,
            alignSelf: "center",
            marginTop:
              compact && plan ? 0 : Platform.OS === "web" || showHeader ? NAV_BAR_HEIGHT_PUBLIC : 0,
          }}
        >
          <View style={{ width: panelWidth, transform: [{ scale }], transformOrigin: "top left" }}>
            {children}
          </View>
        </View>
      </AuthShell>
      {showHeader && Platform.OS !== "web" ? <AuthPageHeader /> : null}
    </View>
  );
}
