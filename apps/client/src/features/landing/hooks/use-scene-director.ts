/**
 * `useSceneDirector` — the chapter-4 choreography, run against the STAGE
 * mascot (the one holding the placard), exactly like the prototype: the same
 * character puts the card down, walks over to the robot, acts the scene, and
 * walks back to his column when the reader moves on.
 *
 * The director owns the timeline and the mascot's acting (poses + gaze);
 * `MascotStage` owns his body (the walk, the legs, the card fading out) and
 * speaks `petLine` through his bubble; `RobotScene` plays the robot's side
 * off the same `step`.
 */

import type { useAuthMascot } from "@patch-careers/ui/editorial";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { useTypewriter } from "./use-typewriter";

/** The prototype's `at(...)` offsets, in ms after the walk lands. */
const SCENE_STEPS = [400, 3100, 3800, 6500, 7500, 9100, 10300, 11100, 12300, 13000, 14600] as const;

export type ScenePetLine =
  | { readonly kind: "serif"; readonly text: string }
  | { readonly kind: "label"; readonly label: string; readonly text?: string }
  | null;

export interface SceneDirector {
  /** −1 while idle or walking in; then 0..10 as the beats land. */
  readonly step: number;
  /** What the mascot's bubble says right now (null = bubble hidden). */
  readonly petLine: ScenePetLine;
}

export function useSceneDirector(
  active: boolean,
  controller: ReturnType<typeof useAuthMascot>,
  walkMs: number,
): SceneDirector {
  const { t } = useI18n();
  const [step, setStep] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
    if (!active) {
      setStep(-1);
      return;
    }
    SCENE_STEPS.forEach((delay, at) => {
      timers.current.push(setTimeout(() => setStep(at), walkMs + delay));
    });
    return () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    };
  }, [active, walkMs]);

  // The acting, one pose per beat (the demo's `pose()` + `look()`).
  const { pose, look } = controller;
  useEffect(() => {
    if (!active) return;
    const set = (name: "talk" | "oops" | "covered" | "happy"): void =>
      pose({ talk: false, oops: false, covered: false, happy: false, sealed: false, [name]: true });
    if (step < 0) {
      set("talk");
      look(-3, 2);
    } else if (step === 3) {
      set("talk");
      look(10, 2);
    } else if (step === 5) {
      set("oops");
      look(-10, 5);
    } else if (step === 6) {
      set("covered");
    } else if (step === 8) {
      set("talk");
      look(10, 2);
    } else if (step === 10) {
      set("happy");
      look(3, 0);
    }
  }, [active, step, pose, look]);

  const heading = t("landing.chapters.cena.heading");
  const typedHeading = useTypewriter(heading, 38, active && step >= 0);

  const petLine: ScenePetLine = !active
    ? null
    : step >= 0 && step <= 2
      ? { kind: "serif", text: typedHeading }
      : step === 3
        ? { kind: "label", label: t("landing.chapters.cena.translatingLabel") }
        : step === 4
          ? {
              kind: "label",
              label: t("landing.chapters.cena.translationLabel"),
              text: t("landing.chapters.cena.translation"),
            }
          : step >= 5 && step <= 7
            ? { kind: "serif", text: t("landing.chapters.cena.oops") }
            : null;

  return { step, petLine };
}
