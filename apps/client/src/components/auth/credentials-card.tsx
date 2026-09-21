/**
 * CredentialsCard — the surface sign-in and sign-up share: the card shell,
 * title block and DEV test-fill link. Screens only add their fields, row and CTA as
 * children; `outside` mounts siblings of the card (dialogs) in the shell.
 *
 * `transit` (sign-up only) drives the "account created" stage: `fade` hides
 * everything but the title, `titleSwap` crossfades the title to
 * `transit.title` in place, and `panelStyle` clamps the panel's height —
 * see `created-stage.tsx` for the choreography.
 */
import { Text } from "@patch-careers/ui";
import { AuthCard, AuthShell, editorialFonts } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { CreatedStageTitle } from "@/components/auth/created-stage";
import { DevFillLink } from "@/components/auth/dev-fill-link";

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
  testIDPrefix,
  onDevFill,
  children,
  outside,
  transit,
  onContentLayout,
}: {
  title: string;
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
  const screenTitleStyle = useAnimatedStyle(() => ({
    opacity: 1 - titleSwap.value,
  }));
  const stageTitleStyle = useAnimatedStyle(() => ({
    opacity: titleSwap.value,
  }));
  const bodyStyle = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));

  return (
    <AuthShell variant="card">
      <AuthCard
        {...(transit ? { panelStyle: transit.panelStyle } : {})}
        {...(onContentLayout ? { onContentLayout } : {})}
      >
        <Animated.View>
          <Animated.View style={screenTitleStyle}>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={38}
              lineHeight={41}
              fontWeight="600"
              letterSpacing={-1.7}
              color="$accent"
            >
              {title}
            </Text>
          </Animated.View>
          {transit ? <CreatedStageTitle title={transit.title} style={stageTitleStyle} /> : null}
        </Animated.View>
        <Animated.View style={bodyStyle}>
          <DevFillLink onPress={onDevFill} testID={`${testIDPrefix}.devFill`} />
          {children}
        </Animated.View>
      </AuthCard>
      {outside}
    </AuthShell>
  );
}
