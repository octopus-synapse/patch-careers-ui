/**
 * `<SwipeableRow>` — wraps content in a horizontally-swipeable container
 * with optional left/right action slots.
 *
 * Minimal implementation — animates a translate via PanResponder. Real
 * gesture-driven physics are deferred to react-native-gesture-handler in
 * a future iteration (TODO).
 */

import { type ReactNode, useRef } from "react";
import { Animated, PanResponder } from "react-native";
import { TStack, TXStack } from "../internal/tamagui-shim";

export type SwipeableRowProps = {
  children: ReactNode;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  /** Distance (px) past which the action fires on release. */
  threshold?: number;
  onLeftAction?: () => void;
  onRightAction?: () => void;
};

export function SwipeableRow({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  onLeftAction,
  onRightAction,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > threshold) {
          onLeftAction?.();
        } else if (g.dx < -threshold) {
          onRightAction?.();
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // Animated.View doesn't expose JSX intrinsic typings cleanly under our
  // strict TS config — cast through a typed ComponentType.
  const AnimView = Animated.View as unknown as React.ComponentType<{
    style: unknown;
    children?: ReactNode;
    [key: string]: unknown;
  }>;

  return (
    <TStack position="relative">
      {leftAction ? (
        <TXStack position="absolute" top={0} left={0} bottom={0} alignItems="center">
          {leftAction}
        </TXStack>
      ) : null}
      {rightAction ? (
        <TXStack position="absolute" top={0} right={0} bottom={0} alignItems="center">
          {rightAction}
        </TXStack>
      ) : null}
      <AnimView {...responder.panHandlers} style={{ transform: [{ translateX }] }}>
        {children}
      </AnimView>
    </TStack>
  );
}
