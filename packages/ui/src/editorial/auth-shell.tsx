/**
 * AuthShell — full-screen scaffold with masthead + safe area.
 *
 * Keeps RN scaffolding (KeyboardAvoidingView / ScrollView / StatusBar /
 * useSafeAreaInsets) — Tamagui has no scroll/keyboard primitive — but the
 * masthead and form column are Tamagui stacks.
 */

import type { ReactElement, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { BrandMark } from "./brand-mark";
import { editorialFonts } from "./fonts";

const flexStyle = { flex: 1 } as const;

export function AuthShell({
  children,
  showEra = true,
}: {
  children: ReactNode;
  /** Shows the "EST · 2025" masthead flourish. Off on sign-in/sign-up. */
  showEra?: boolean;
}): ReactElement {
  const insets = useSafeAreaInsets();
  const editorialPalette = useEditorialPalette();
  const barStyle = useThemeName() === "dark" ? "light-content" : "dark-content";
  return (
    <View style={[flexStyle, { backgroundColor: editorialPalette.bg }]}>
      <StatusBar barStyle={barStyle} backgroundColor={editorialPalette.bg} />
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
              {showEra ? (
                <TText
                  fontFamily={editorialFonts.mono}
                  fontSize={10}
                  letterSpacing={1.8}
                  color="$inkSubtle"
                >
                  EST · 2025
                </TText>
              ) : null}
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
