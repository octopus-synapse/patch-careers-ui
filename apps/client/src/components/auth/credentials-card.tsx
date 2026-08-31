/**
 * CredentialsCard — the surface sign-in and sign-up share: the card shell
 * with the mascot on top, the title block, the provider chip row and the
 * DEV test-fill link. Screens only add their fields, row and CTA as
 * children; `outside` mounts siblings of the card (dialogs) in the shell.
 *
 * `transit` (sign-up only) drives the "account created" stage: `fade` hides
 * everything but the title, `titleSwap` crossfades the title to
 * `transit.title` in place, and `panelStyle` clamps the panel's height —
 * see `created-stage.tsx` for the choreography.
 */
import { Text } from "@patch-careers/ui";
import {
  AuthMascotCard,
  type AuthMascotController,
  AuthShell,
  editorialFonts,
} from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  AUTH_TITLE_FONT_SIZE,
  AUTH_TITLE_LINE_HEIGHT,
  CreatedStageTitle,
} from "@/components/auth/created-stage";
import { DevFillLink } from "@/components/auth/dev-fill-link";
import { OAuthProviderRow } from "@/components/auth/oauth-provider-row";

export interface CredentialsTransit {
  /** 0 = form, 1 = only the title is left. */
  fade: SharedValue<number>;
  /** 0 = screen title, 1 = the stage title. */
  titleSwap: SharedValue<number>;
  title: string;
  panelStyle: StyleProp<ViewStyle>;
}

export function CredentialsCard({
  title,
  mascot,
  testIDPrefix,
  onDevFill,
  children,
  outside,
  transit,
  onContentLayout,
}: {
  title: string;
  mascot: AuthMascotController;
  /** `auth` on sign-in, `signup` on sign-up — keeps the existing E2E ids. */
  testIDPrefix: string;
  onDevFill: () => void;
  children: ReactNode;
  outside?: ReactNode;
  transit?: CredentialsTransit;
  /**
   * Reports the card content's natural height from the first layout on —
   * wired permanently, since `onLayout` only fires on change and a transit
   * that attached it late would read a stale zero.
   */
  onContentLayout?: (e: LayoutChangeEvent) => void;
}): ReactElement {
  // The tree must not change shape when `transit` appears, or the mascot and
  // card would remount (and re-run their entrances) on the success beat —
  // so the animated wrappers are always there, driven by these idle values
  // until a transit takes over.
  const idleFade = useSharedValue(0);
  const idleSwap = useSharedValue(0);
  const fade = transit?.fade ?? idleFade;
  const titleSwap = transit?.titleSwap ?? idleSwap;
  const screenTitleStyle = useAnimatedStyle(() => ({ opacity: 1 - titleSwap.value }));
  const stageTitleStyle = useAnimatedStyle(() => ({ opacity: titleSwap.value }));
  const bodyStyle = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));

  return (
    <AuthShell variant="card">
      <AuthMascotCard
        mascot={mascot}
        {...(transit ? { panelStyle: transit.panelStyle } : {})}
        {...(onContentLayout ? { onContentLayout } : {})}
      >
        <Animated.View>
          <Animated.View style={screenTitleStyle}>
            <Text
              textAlign="center"
              fontFamily={editorialFonts.sans}
              fontSize={AUTH_TITLE_FONT_SIZE}
              lineHeight={AUTH_TITLE_LINE_HEIGHT}
              fontWeight="600"
              letterSpacing={-0.4}
              color="$ink"
            >
              {title}
            </Text>
          </Animated.View>
          {transit ? <CreatedStageTitle title={transit.title} style={stageTitleStyle} /> : null}
        </Animated.View>
        <Animated.View style={bodyStyle}>
          <OAuthProviderRow testIDPrefix={testIDPrefix} />
          <DevFillLink onPress={onDevFill} testID={`${testIDPrefix}.devFill`} />
          {children}
        </Animated.View>
      </AuthMascotCard>
      {outside}
    </AuthShell>
  );
}
