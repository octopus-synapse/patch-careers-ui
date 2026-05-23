/**
 * `<Toast>` + `<ToastProvider>` — ephemeral notification surface.
 *
 * Built on `@tamagui/toast` so we inherit native swipe-to-dismiss and
 * portal management; we tint by `intent` and fire a matching haptic
 * (success/warning/error) when the toast appears.
 */

import { intent as intentTokens } from "@patch-careers/tokens/colors";
import {
  Toast as TamaguiToast,
  ToastProvider as TamaguiToastProvider,
  ToastViewport as TamaguiToastViewport,
  useToastController,
  useToastState,
} from "@tamagui/toast";
import { type ComponentType, type ReactNode, useEffect } from "react";
import { type HapticImpact, hapticImpact } from "../internal/haptics";
import { TStack } from "../internal/tamagui-shim";
import type { Intent } from "../internal/types";
import { useThemeName } from "../internal/use-theme-name";
import { Text } from "../primitives/text";

type LooseProps = Record<string, unknown> & { children?: ReactNode };

const TToast = TamaguiToast as unknown as ComponentType<LooseProps>;
const TToastProvider = TamaguiToastProvider as unknown as ComponentType<LooseProps>;
const TToastViewport = TamaguiToastViewport as unknown as ComponentType<LooseProps>;

const INTENT_TO_HAPTIC: Record<Intent, HapticImpact> = {
  neutral: "light",
  accent: "light",
  danger: "error",
  success: "success",
};

export type ToastIntent = Intent;

export type ShowToastOptions = {
  title: string;
  message?: string;
  intent?: ToastIntent;
  durationMs?: number;
};

export function useToast() {
  const controller = useToastController();
  return {
    show({ title, message, intent: intentName = "neutral", durationMs = 3000 }: ShowToastOptions) {
      hapticImpact(INTENT_TO_HAPTIC[intentName]);
      controller.show(title, {
        message,
        duration: durationMs,
        customData: { intent: intentName },
      });
    },
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <TToastProvider swipeDirection="horizontal" duration={3000}>
      {children}
      <TToastViewport multipleToasts top={16} right={16} left={16} />
      <ToastRenderer />
    </TToastProvider>
  );
}

function ToastRenderer() {
  const current = useToastState();
  if (!current || current.isHandledNatively) return null;
  const intentName = ((current.customData?.intent as Intent | undefined) ?? "neutral") as Intent;
  return (
    <ToastVisual
      title={current.title}
      intent={intentName}
      {...(current.message ? { message: current.message } : {})}
    />
  );
}

function ToastVisual({
  title,
  message,
  intent: intentName,
}: {
  title: string;
  message?: string;
  intent: Intent;
}) {
  const themeName = useThemeName();
  const tokens = intentTokens[intentName][themeName];
  useEffect(() => {
    hapticImpact(INTENT_TO_HAPTIC[intentName]);
  }, [intentName]);

  return (
    <TToast
      key={title}
      backgroundColor={tokens.bg}
      borderRadius={12}
      padding={12}
      animation="quick"
      enterStyle={{ opacity: 0, scale: 0.9, y: -16 }}
      exitStyle={{ opacity: 0, scale: 0.9, y: -16 }}
    >
      <TStack gap={4}>
        <Text preset="label" color={tokens.fg}>
          {title}
        </Text>
        {message ? (
          <Text preset="caption" color={tokens.fg}>
            {message}
          </Text>
        ) : null}
      </TStack>
    </TToast>
  );
}
