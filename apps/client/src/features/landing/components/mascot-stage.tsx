/**
 * `MascotStage` — the one mascot of the page, in the grid's right-hand column.
 *
 * He is a single continuous character, exactly like the prototype's `#pet`:
 * he holds the placard on ordinary chapters; on the scene he puts the card
 * down (it fades), grows legs and WALKS from his column to the robot — and
 * walks back when the reader moves on; on the finale he walks to the centre
 * of the page and the card he lands with IS the "create account" button.
 *
 * The composition reuses the design system's `AuthMascotCard` (body behind,
 * card, arms in front) so the forearms rest on the card's top edge; the legs
 * are absolutely positioned under the body and swing only while walking,
 * while the torso hops — the prototype's gait, split across the same layers.
 */

import { shadows } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { AuthMascotCard, editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useI18n } from "@/providers/i18n-provider";
import type { LandingMascot } from "../hooks/use-landing-mascot";
import type { ScenePetLine } from "../hooks/use-scene-director";
import { landingSans } from "../lib/landing-fonts";
import { landingGrid, MASCOT_WIDTH, sceneLayout, walkMsFor } from "../lib/layout";
import type { ChapterDirection } from "../types";
import { AccentGlow } from "./accent-glow";
import { MascotLegs } from "./mascot-legs";
import { PlacardText } from "./placard-card";

export type MascotStageMode = "stage" | "scene" | "finale";

export interface MascotStageProps {
  readonly mascot: LandingMascot;
  readonly soft: string;
  readonly windowWidth: number;
  readonly windowHeight: number;
  readonly placardText: string;
  readonly placardSource?: string | undefined;
  readonly mode: MascotStageMode;
  /** What he says during the scene (the prototype's `#sayPet`). */
  readonly petLine: ScenePetLine;
  /** Deck travel direction — drives the glow's counter-drift. */
  readonly direction: ChapterDirection;
  readonly index: number;
  /**
   * He is one character, so he cannot be in two places at once: while an
   * overlay leans him on its own card (the auth dialog's `AuthMascotCard`),
   * the stage fades out — the demo's `body.authing`. Kept mounted so the walk
   * state, the glow drift and the chapter's placard survive the round trip.
   */
  readonly hidden?: boolean;
}

/**
 * The placard is a lighter thing than an auth panel: no form inside, so it
 * sheds most of its vertical padding and holds a floor height, which keeps the
 * mascot at the same altitude whether the line is one sentence or three.
 */
const PLACARD_PANEL = {
  minHeight: 168,
  // The demo's `pt-14`: the top of the card belongs to the mascot's forearms,
  // so the text starts well below the fingers however long the line runs.
  paddingTop: 56,
  paddingBottom: 28,
  paddingHorizontal: 28,
};

/** Panel dissolved: the card IS the button now (the demo's `.btncard`). */
const BUTTON_PANEL = {
  minHeight: 0,
  paddingTop: 56,
  paddingBottom: 0,
  paddingHorizontal: 0,
  backgroundColor: "transparent",
  borderWidth: 0,
  shadowOpacity: 0,
  elevation: 0,
};

/** The demo's hop cadence while walking. */
const HOP_MS = 420;
/** Card top within the walk view (`AuthMascotCard`'s body headroom). */
const CARD_TOP = 200;
/**
 * Where the hips sit: the artwork's legs hang from y=262 with the card top at
 * y=232 (0.75 scale → 22.5px), and the leg SVG carries 4.5px of headroom.
 */
const LEGS_TOP = CARD_TOP + 22.5 - 4.5;

export function MascotStage({
  mascot,
  soft,
  windowWidth,
  windowHeight,
  placardText,
  placardSource,
  mode,
  petLine,
  direction,
  index,
  hidden = false,
}: MascotStageProps): ReactElement {
  const grid = landingGrid(windowWidth);
  const palette = useEditorialPalette();
  const router = useRouter();
  const localized = useLocalizedHref();
  const { t } = useI18n();

  const walkX = useSharedValue(0);
  const walkY = useSharedValue(0);
  const hop = useSharedValue(0);
  const [walking, setWalking] = useState(false);
  const [settled, setSettled] = useState<MascotStageMode>("stage");
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const position = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (walkTimer.current) clearTimeout(walkTimer.current);

    const target =
      mode === "scene"
        ? { x: sceneLayout(windowWidth, windowHeight).walkDx, y: 0 }
        : mode === "finale"
          ? { x: windowWidth / 2 - (grid.stageLeft + grid.stageWidth / 2), y: 110 }
          : { x: 0, y: 0 };

    if (target.x === position.current.x && target.y === position.current.y) {
      setSettled(mode);
      return;
    }

    const ms = walkMsFor(target.x - position.current.x);
    position.current = target;
    setWalking(true);
    setSettled("stage");
    walkX.value = withTiming(target.x, { duration: ms, easing: Easing.linear });
    walkY.value = withTiming(target.y, { duration: ms, easing: Easing.linear });
    hop.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: HOP_MS / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: HOP_MS / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      Math.round(ms / HOP_MS),
    );
    walkTimer.current = setTimeout(() => {
      cancelAnimation(hop);
      hop.value = withTiming(0, { duration: 120 });
      setWalking(false);
      setSettled(mode);
    }, ms);
    return () => {
      if (walkTimer.current) clearTimeout(walkTimer.current);
    };
  }, [mode, grid.stageLeft, grid.stageWidth, hop, walkX, walkY, windowWidth, windowHeight]);

  // The glow lags a beat behind every chapter change (the demo's `#glow.move`).
  const glowDrift = useSharedValue(0);
  useEffect(() => {
    if (index < 0) return;
    glowDrift.value = direction === "down" ? 34 : -34;
    glowDrift.value = withTiming(0, { duration: 900, easing: Easing.bezier(0.2, 0.75, 0.2, 1) });
  }, [direction, index, glowDrift]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: glowDrift.value }],
  }));

  const walkStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: walkX.value }, { translateY: walkY.value }],
  }));
  const torsoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hop.value }],
  }));

  const showButton = mode === "finale" && settled === "finale";
  const inScene = mode === "scene";
  const legsVisible = inScene || walking || (mode === "finale" && !showButton);
  // The card fades away for the whole scene and for every walk (`.noCard`).
  const cardHidden =
    inScene || walking || (mode === "finale" && !showButton) || (placardText === "" && !showButton);

  return (
    <YStack
      position="absolute"
      left={grid.stageLeft}
      width={grid.stageWidth}
      top={0}
      bottom={0}
      alignItems="center"
      justifyContent="center"
      opacity={hidden ? 0 : 1}
      animation="medium"
      pointerEvents={hidden ? "none" : "box-none"}
    >
      {/* The demo kills the glow for the whole scene (`body.scene #glow`). */}
      <Animated.View
        style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, glowStyle]}
        pointerEvents="none"
      >
        <YStack flex={1} opacity={inScene ? 0 : 1} animation="slow">
          <AccentGlow color={soft} />
        </YStack>
      </Animated.View>

      <Animated.View style={walkStyle}>
        <YStack width={MASCOT_WIDTH} pointerEvents="box-none" position="relative">
          {/* The scene bubble, above his head (the prototype's `#sayPet`). */}
          {petLine ? (
            <YStack
              position="absolute"
              bottom="100%"
              left={-60}
              right={-60}
              alignItems="center"
              marginBottom={26}
              zIndex={3}
              pointerEvents="none"
            >
              <YStack
                backgroundColor={palette.panel}
                borderWidth={1}
                borderColor={palette.hairline}
                borderRadius={18}
                paddingHorizontal={18}
                paddingVertical={14}
                maxWidth={300}
                minHeight={54}
                justifyContent="center"
                shadowColor={shadows.lg.mobile.shadowColor}
                shadowOpacity={shadows.lg.mobile.shadowOpacity}
                shadowRadius={shadows.lg.mobile.shadowRadius}
                shadowOffset={shadows.lg.mobile.shadowOffset}
              >
                {petLine.kind === "serif" ? (
                  <Text
                    fontFamily={editorialFonts.serif}
                    fontSize={22}
                    lineHeight={28}
                    color={palette.ink}
                    textAlign="center"
                  >
                    {petLine.text}
                  </Text>
                ) : (
                  <YStack alignItems="center" gap={4}>
                    <Text fontFamily={editorialFonts.mono} fontSize={11} color={palette.subtle}>
                      {petLine.label}
                    </Text>
                    {petLine.text ? (
                      <Text fontFamily={landingSans} fontSize={17} color={palette.ink}>
                        {petLine.text}
                      </Text>
                    ) : null}
                  </YStack>
                )}
              </YStack>
              <YStack
                width={16}
                height={16}
                marginTop={-8}
                backgroundColor={palette.panel}
                borderRightWidth={1}
                borderBottomWidth={1}
                borderColor={palette.hairline}
                rotate="45deg"
              />
            </YStack>
          ) : null}

          <Animated.View style={torsoStyle}>
            <AuthMascotCard
              mascot={mascot.controller}
              panelStyle={[
                showButton ? BUTTON_PANEL : PLACARD_PANEL,
                { opacity: cardHidden ? 0 : 1 },
              ]}
              animateIn={false}
            >
              {showButton ? (
                <Pressable
                  onPress={() => router.push(localized("/(auth)/sign-up"))}
                  accessibilityRole="button"
                >
                  <XStack
                    backgroundColor={palette.primary}
                    borderRadius={999}
                    paddingVertical={19}
                    paddingHorizontal={30}
                    justifyContent="center"
                    shadowColor={shadows.xl.mobile.shadowColor}
                    shadowOpacity={shadows.xl.mobile.shadowOpacity}
                    shadowRadius={shadows.xl.mobile.shadowRadius}
                    shadowOffset={shadows.xl.mobile.shadowOffset}
                  >
                    <Text
                      fontFamily={landingSans}
                      fontSize={17}
                      fontWeight="600"
                      color={palette.onPrimary}
                    >
                      {`${t("landing.chapters.cta.button")} →`}
                    </Text>
                  </XStack>
                </Pressable>
              ) : (
                <PlacardText text={placardText} source={placardSource} />
              )}
            </AuthMascotCard>
          </Animated.View>

          {/* Legs, planted under the body (the torso hops over them). */}
          <YStack
            position="absolute"
            top={LEGS_TOP}
            left={0}
            right={0}
            alignItems="center"
            zIndex={-1}
            pointerEvents="none"
          >
            <MascotLegs walking={walking} visible={legsVisible} />
          </YStack>
        </YStack>
      </Animated.View>
    </YStack>
  );
}
