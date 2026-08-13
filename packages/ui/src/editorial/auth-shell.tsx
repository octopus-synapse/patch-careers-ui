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
  variant = "default",
}: {
  children: ReactNode;
  /** Shows the "EST · 2025" masthead flourish. Off on sign-in/sign-up. */
  showEra?: boolean;
  /**
   * `card` hands the whole viewport to the child (no masthead, no gutter, no
   * 420pt clamp) and centers it vertically — the shape `AuthCard` needs, since
   * it paints its own inverted surface edge to edge of its 90% column.
   */
  variant?: "default" | "card";
}): ReactElement {
  const insets = useSafeAreaInsets();
  const editorialPalette = useEditorialPalette();
  const barStyle = useThemeName() === "dark" ? "light-content" : "dark-content";
  const isCard = variant === "card";
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
            paddingHorizontal: isCard ? 0 : 28,
            paddingTop: insets.top + (isCard ? 16 : 20),
            paddingBottom: insets.bottom + (isCard ? 16 : 32),
            justifyContent: isCard ? "center" : "flex-start",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Masthead — tiny editorial flourish at the top edge */}
          {isCard ? null : (
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
          )}

          {/* Form column — left-aligned, generous whitespace */}
          {isCard ? (
            children
          ) : (
            <TYStack width="100%" maxWidth={420} alignSelf="center">
              {children}
            </TYStack>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
