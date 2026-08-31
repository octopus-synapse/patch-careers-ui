/**
 * AuthMascotCard — `AuthCard` with the auth mascot perched on top.
 *
 * The mascot's body layer goes behind the card and its arms layer in front,
 * so the forearms rest on the card's top edge; the wrapper leaves the body
 * headroom (`MASCOT_CARD_TOP_SPACE`). `position: relative` on the card
 * wrapper is what makes `zIndex` bite on web.
 *
 * `below` mounts out-of-flow siblings under the card (e.g. a back link) so
 * they never shift the mascot: two screens with the same card height then
 * place the mascot at the same point of the viewport.
 */
import type { ReactElement, ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { TYStack } from "../internal/tamagui-shim";
import { AuthCard } from "./auth-card";
import { AuthMascot, type AuthMascotController, MASCOT_CARD_TOP_SPACE } from "./auth-mascot";

export function AuthMascotCard({
  mascot,
  children,
  panelStyle,
  onContentLayout,
  below,
  animateIn,
}: {
  mascot: AuthMascotController;
  children: ReactNode;
  panelStyle?: StyleProp<ViewStyle>;
  onContentLayout?: (e: LayoutChangeEvent) => void;
  below?: ReactNode;
  /** See `AuthCard`. */
  animateIn?: boolean;
}): ReactElement {
  return (
    <TYStack position="relative" marginTop={MASCOT_CARD_TOP_SPACE} overflow="visible">
      <AuthMascot controller={mascot} layer="body" />
      <TYStack position="relative" zIndex={1}>
        <AuthCard
          {...(panelStyle ? { panelStyle } : {})}
          {...(onContentLayout ? { onContentLayout } : {})}
          {...(animateIn === undefined ? {} : { animateIn })}
        >
          {children}
        </AuthCard>
      </TYStack>
      <AuthMascot controller={mascot} layer="arms" />
      {below ? (
        <TYStack position="absolute" top="100%" left={0} right={0} alignItems="center">
          {below}
        </TYStack>
      ) : null}
    </TYStack>
  );
}
