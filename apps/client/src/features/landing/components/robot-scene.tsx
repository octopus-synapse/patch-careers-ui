/**
 * `RobotScene` — the robot's half of chapter 4.
 *
 * The mascot is NOT here: he is the stage mascot, who walks over from his
 * column (see `MascotStage` + `useSceneDirector`). This component renders the
 * robot at the scene's fixed spot — feet on the same line as the mascot's
 * boots — and plays his side of the beats: idle → binary flicker while he
 * "reads" → ¬_¬ → ^_^ → handshake; his bubble types raw binary, exactly as
 * rude as it sounds.
 */

import { shadows } from "@patch-careers/tokens";
import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { toBinary, useTypewriter } from "../hooks/use-typewriter";
import { landingSound } from "../lib/landing-sound";
import { SCENE_ROBOT_WIDTH, sceneLayout } from "../lib/layout";
import { LandingRobot, type RobotFace } from "./robot";

export interface RobotSceneProps {
  readonly width: number;
  /** The director's beat, −1 while the mascot is still walking in. */
  readonly step: number;
  readonly active: boolean;
}

export function RobotScene({ width, step, active }: RobotSceneProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const { height } = useWindowDimensions();
  const scene = sceneLayout(width, height);
  const isDesktop = width >= 1024;

  const [chest, setChest] = useState("· · ·");

  // The robot's chest: idle dots → binary flicker while it "reads" → ¬_¬ → ^_^.
  const flicker = active && step >= 1 && step < 5;
  useEffect(() => {
    if (!flicker) return;
    const interval = setInterval(() => {
      setChest(Math.random().toString(2).slice(2, 9));
    }, 90);
    return () => clearInterval(interval);
  }, [flicker]);
  useEffect(() => {
    if (!active || step < 0) setChest("· · ·");
    else if (step === 5) setChest("¬_¬");
    else if (step === 7) setChest("^_^");
  }, [active, step]);

  const robotFace: RobotFace = !active ? "idle" : step >= 7 ? "happy" : step >= 1 ? "scan" : "idle";
  const shake = active && (step === 8 || step === 9);

  const binary = toBinary(t("landing.chapters.cena.robotSays"));
  const typedBinary = useTypewriter(binary, 14, active && step >= 2);
  const botTalking = active && step >= 2 && step < 7;

  // The demo bips every third character the robot types, and pops the handshake.
  useEffect(() => {
    if (botTalking && typedBinary.length > 0 && typedBinary.length % 3 === 0) {
      landingSound.play("bip");
    }
  }, [botTalking, typedBinary.length]);
  useEffect(() => {
    if (active && step === 9) landingSound.play("pop");
  }, [active, step]);

  return (
    <YStack
      {...(isDesktop
        ? { position: "absolute", left: scene.robotLeft, top: scene.robotTop }
        : { alignSelf: "center", marginTop: 120 })}
      width={SCENE_ROBOT_WIDTH}
    >
      {/* The robot's bubble: raw binary, mono. */}
      <YStack
        position="absolute"
        bottom="100%"
        right={0}
        marginBottom={18}
        width={260}
        opacity={botTalking ? 1 : 0}
        backgroundColor={palette.panel}
        borderWidth={1}
        borderColor={palette.hairline}
        borderRadius={18}
        paddingHorizontal={18}
        paddingVertical={14}
        shadowColor={shadows.lg.mobile.shadowColor}
        shadowOpacity={shadows.lg.mobile.shadowOpacity}
        shadowRadius={shadows.lg.mobile.shadowRadius}
        shadowOffset={shadows.lg.mobile.shadowOffset}
      >
        <Text fontFamily={editorialFonts.mono} fontSize={12} lineHeight={17} color={palette.ink}>
          {typedBinary}
        </Text>
      </YStack>
      <LandingRobot width={SCENE_ROBOT_WIDTH} face={robotFace} chest={chest} shake={shake} />
    </YStack>
  );
}
