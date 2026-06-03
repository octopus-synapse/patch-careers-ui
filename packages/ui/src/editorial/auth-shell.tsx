/**
 * AuthShell — full-screen scaffold with masthead + safe area.
 *
 * Keeps RN scaffolding (KeyboardAvoidingView / ScrollView / StatusBar /
 * useSafeAreaInsets) — Tamagui has no scroll/keyboard primitive — but the
 * masthead and form column are Tamagui stacks.
 */

import { editorialPalette } from "@patch-careers/tokens";
import type { ReactElement, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { BrandMark } from "./brand-mark";
import { editorialFonts } from "./fonts";

const rootStyle = { flex: 1, backgroundColor: editorialPalette.bg } as const;
const flexStyle = { flex: 1 } as const;

export function AuthShell({ children }: { children: ReactNode }): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={rootStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={editorialPalette.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={flexStyle}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Masthead — tiny editorial flourish at the top edge */}
          <Animated.View entering={FadeIn.duration(400)}>
            <TXStack alignItems="center" justifyContent="space-between" marginBottom={56}>
              <TXStack alignItems="center">
                <BrandMark size={22} />
              </TXStack>
              <TText
                fontFamily={editorialFonts.mono}
                fontSize={10}
                letterSpacing={1.8}
                color="$inkSubtle"
              >
                EST · 2025
              </TText>
            </TXStack>
          </Animated.View>

          {/* Form column — left-aligned, generous whitespace */}
          <TYStack width="100%" maxWidth={420} alignSelf="center">
            {children}
          </TYStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
