/**
 * AuthMascot — the two-piece jigsaw character that sits on top of the auth
 * card and reacts to the form (ported from the approved
 * `signup-mascot-demo.html` prototype).
 *
 * Two layers share one coordinate system: the *body* is rendered behind the
 * card, the *arms* in front of it, so the forearms rest on the card's top
 * edge with the hands hanging over. The screen mounts both layers around
 * `AuthCard` (see `MASCOT_CARD_TOP_SPACE`) and drives them through the
 * controller returned by `useAuthMascot()`.
 *
 * Choreography (what each expression *is*) lives in `internal/mascot-model`
 * and is unit-tested; this file only tweens towards those targets. Every
 * moving part is an `AnimatedG` with `translate/rotation/scale + origin`
 * props — react-native-svg resolves those on native and web alike (web
 * re-runs `prepare()` from `setNativeProps`), which is why the tree is
 * nested exactly like the prototype's CSS transform groups.
 */

import { type ReactElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  type EasingFunction,
  type EasingFunctionFactory,
  type SharedValue,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from "react-native-svg";
import {
  caretProgress,
  FINGERS,
  fingerPath,
  gazeForProgress,
  IDLE_FLAGS,
  isEmailShapeValid,
  type MascotFlags,
  type MascotPalette,
  type MascotPose,
  mascotPaletteFor,
  poseFor,
  SNAP_TIMELINE,
  THUMB_CURL_FACTOR,
} from "../internal/mascot-model";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** Rendered width of both layers; the viewBox is 500 wide → scale 0.75. */
const MASCOT_WIDTH = 375;
const SCALE = MASCOT_WIDTH / 500;
const BODY_HEIGHT = 310 * SCALE;
const ARMS_HEIGHT = 380 * SCALE;
/** Card top edge is y = 232 in user units; the viewBox starts at y = −60. */
const LAYER_TOP = -(232 + 60) * SCALE;
/** Vertical room the screen must leave above the card for the body. */
export const MASCOT_CARD_TOP_SPACE = 200;

const BREATH_MS = 1700;
/**
 * Breathing runs off one module-wide clock: every instance derives its phase
 * from `BREATH_EPOCH`, so the mascot on the sign-up screen and the one that
 * replaces it on verify-email inhale in lockstep and the route crossfade
 * between them reads as a single, continuous character.
 */
const BREATH_EPOCH = Date.now();
const AUTH_INPUT_FONT_SIZE = 17;

const armEase = Easing.bezier(0.3, 1.12, 0.5, 1);
const lidCloseEase = Easing.bezier(0.6, 0, 0.9, 0.45);
const lidOpenEase = Easing.bezier(0.2, 0.65, 0.35, 1);
const browEase = Easing.bezier(0.3, 1.1, 0.5, 1);
const snapEase = Easing.bezier(0.36, 0.07, 0.19, 0.97);

/* ------------------------------------------------------------------ */
/* Controller                                                          */
/* ------------------------------------------------------------------ */

export interface AuthMascotController {
  flags: MascotFlags;
  gazeX: SharedValue<number>;
  gazeY: SharedValue<number>;
  onTextFieldFocus: (field: "name" | "email") => void;
  onTextFieldBlur: (field: "name" | "email", value: string) => void;
  /** Call on every change/selection so the pupils follow the caret. */
  onTextFieldCaret: (field: "name" | "email", value: string, caretIndex: number) => void;
  onPasswordFocus: () => void;
  onPasswordBlur: (value: string) => void;
  onPasswordVisibility: (visible: boolean) => void;
  /**
   * The "match": pieces split and click back together. With `settle` the
   * finale lands in the `sealed` rest instead of plain idle (account created).
   */
  celebrate: (opts?: { settle?: boolean }) => void;
  /** Grimace (e.g. the server rejected the credentials). */
  grimace: () => void;
  /** Settle into the content `sealed` rest (clears any grimace). */
  seal: () => void;
  /** ^ ^ eyes and a grin, held until `seal()`/`reset()` (e-mail verified). */
  beam: () => void;
  /** Aim the pupils along a row: 0 = its start, 1 = its end (OTP cells). */
  lookAt: (progress: number, y?: number) => void;
  /**
   * Aim the pupils directly, in the same -10..10 / -8..8 space `lookAt` maps
   * into. For callers that already know where they want him looking (a cursor,
   * an element on screen) rather than a position along a row.
   */
  look: (x: number, y: number) => void;
  /**
   * Set poses directly. The named methods above cover the auth flows; a
   * surface that drives its own choreography (the landing's chapters) patches
   * the flags it wants and leaves the rest alone.
   */
  pose: (flags: Partial<MascotFlags>) => void;
  reset: () => void;
}

export function useAuthMascot(): AuthMascotController {
  const [flags, setFlags] = useState<MascotFlags>(IDLE_FLAGS);
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);
  const reduced = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const showing = useRef(false);
  const passwordFocused = useRef(false);
  const snapping = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const patch = useCallback((p: Partial<MascotFlags>) => {
    setFlags((f) => ({ ...f, ...p }));
  }, []);

  const look = useCallback(
    (x: number, y: number) => {
      const cfg = { duration: reduced ? 0 : 120, easing: Easing.linear };
      gazeX.value = withTiming(x, cfg);
      gazeY.value = withTiming(y, cfg);
    },
    [gazeX, gazeY, reduced],
  );

  // The auth card is 90% of the window up to 460, minus its 26px gutters.
  const fieldWidth = Math.min(460, windowWidth * 0.9) - 52;

  const pawState = useCallback(() => {
    if (passwordFocused.current) {
      patch({ talk: false, oops: false, peek: showing.current, covered: !showing.current });
      if (showing.current) look(0, 7);
      else look(0, 0);
    } else {
      patch({ covered: false, peek: false });
      look(0, 0);
    }
  }, [patch, look]);

  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  return useMemo<AuthMascotController>(
    () => ({
      flags,
      gazeX,
      gazeY,
      onTextFieldFocus: () => patch({ talk: true, covered: false, peek: false, oops: false }),
      onTextFieldBlur: (field, value) => {
        patch({
          talk: false,
          oops: field === "email" && value !== "" && !isEmailShapeValid(value),
        });
        look(0, 0);
      },
      onTextFieldCaret: (field, value, caretIndex) => {
        const gaze = gazeForProgress(
          caretProgress(caretIndex, fieldWidth, AUTH_INPUT_FONT_SIZE),
          field === "email" ? 6 : 3,
        );
        look(gaze.x, gaze.y);
        if (field === "email") patch({ valid: isEmailShapeValid(value) });
      },
      onPasswordFocus: () => {
        passwordFocused.current = true;
        pawState();
      },
      onPasswordBlur: (value) => {
        passwordFocused.current = false;
        pawState();
        patch({ oops: value !== "" && value.length < 8 });
      },
      // The eye toggle hands focus back to the field (see PasswordInput), so
      // flipping it always means "password active": cover ↔ peek right away.
      onPasswordVisibility: (visible) => {
        showing.current = visible;
        passwordFocused.current = true;
        pawState();
      },
      celebrate: (opts) => {
        if (snapping.current) return;
        snapping.current = true;
        setFlags((f) => ({ ...IDLE_FLAGS, valid: f.valid, snap: true }));
        look(0, 0);
        const at = (ms: number, p: Partial<MascotFlags>, done = false): void => {
          timers.current.push(
            setTimeout(() => {
              patch(p);
              if (done) snapping.current = false;
            }, ms),
          );
        };
        at(SNAP_TIMELINE.whoaOn, { whoa: true });
        at(SNAP_TIMELINE.whoaOff, { whoa: false });
        at(SNAP_TIMELINE.happyOn, { happy: true });
        at(SNAP_TIMELINE.snapOff, { snap: false });
        at(
          SNAP_TIMELINE.happyOff,
          opts?.settle ? { happy: false, valid: false, sealed: true } : { happy: false },
          true,
        );
      },
      grimace: () => patch({ oops: true, talk: false, covered: false, peek: false }),
      seal: () => {
        patch({
          sealed: true,
          oops: false,
          happy: false,
          talk: false,
          covered: false,
          peek: false,
        });
      },
      beam: () => patch({ happy: true, oops: false }),
      lookAt: (progress, y = 6) => {
        const gaze = gazeForProgress(progress, y);
        look(gaze.x, gaze.y);
      },
      look,
      pose: patch,
      reset: () => {
        setFlags(IDLE_FLAGS);
        look(0, 0);
      },
    }),
    [flags, gazeX, gazeY, patch, look, pawState, fieldWidth],
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface AuthMascotProps {
  controller: AuthMascotController;
  /** `body` mounts behind the card, `arms` in front of it. */
  layer: "body" | "arms";
}

export function AuthMascot({ controller, layer }: AuthMascotProps): ReactElement {
  const editorial = useEditorialPalette();
  const theme = useThemeName();
  const palette = useMemo(() => mascotPaletteFor(theme, editorial.success), [theme, editorial]);
  const reduced = useReducedMotion();

  // Idle breathing: 0 → 1 → 0, shared by body and shoulders, phase-locked
  // to the module clock (see BREATH_EPOCH).
  const breath = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      breath.value = 0;
      return;
    }
    const elapsed = (Date.now() - BREATH_EPOCH) % (2 * BREATH_MS);
    const inhaling = elapsed < BREATH_MS;
    const t = (inhaling ? elapsed : elapsed - BREATH_MS) / BREATH_MS;
    const eased = Easing.inOut(Easing.sin)(t);
    breath.value = inhaling ? eased : 1 - eased;
    const target = inhaling ? 1 : 0;
    const remaining = BREATH_MS * (1 - t);
    breath.value = withSequence(
      withTiming(target, { duration: remaining, easing: Easing.out(Easing.sin) }),
      withRepeat(
        withTiming(1 - target, { duration: BREATH_MS, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [breath, reduced]);

  const style = layer === "body" ? styles.body : styles.arms;
  return (
    <View
      style={style}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      {layer === "body" ? (
        <Body controller={controller} palette={palette} breath={breath} reduced={reduced} />
      ) : (
        <Arms controller={controller} palette={palette} breath={breath} reduced={reduced} />
      )}
    </View>
  );
}

interface LayerProps {
  controller: AuthMascotController;
  palette: MascotPalette;
  breath: SharedValue<number>;
  reduced: boolean;
}

/** `withTiming` that collapses to an instant set under reduced motion. */
function useTween(reduced: boolean) {
  return useCallback(
    (
      v: number,
      duration: number,
      easing: EasingFunction | EasingFunctionFactory = Easing.out(Easing.cubic),
    ) => (reduced ? v : withTiming(v, { duration, easing })),
    [reduced],
  );
}

/* ---------------------------- Body ------------------------------- */

const SERIOUS_BODY =
  "M 20 0 H 135 V 66 H 149 A 22 22 0 1 1 149 94 H 135 V 157.9 A 42 42 0 1 0 95 228.5 V 282 A 8 8 0 0 1 87 290 H 20 A 20 20 0 0 1 0 270 V 20 A 20 20 0 0 1 20 0 Z";
const EAGER_BODY =
  "M 153 23 H 256 A 24 24 0 0 1 280 47 V 163 A 22 22 0 0 0 280 207 V 266 A 24 24 0 0 1 256 290 H 115 A 8 8 0 0 1 107 282 V 224 A 8 8 0 0 0 98 217 A 30 30 0 1 1 128 168 A 11 11 0 0 0 147 160 V 108.2 A 34 34 0 1 0 147 51.8 V 29 A 6 6 0 0 1 153 23 Z";
/** Upper lid: a plate with a round hole; sliding it down 66 shuts the eye. */
const LID_SHAPE = "M -90 -120 H 90 V 120 H -90 Z M 0 -33 A 33 33 0 1 0 0 33 A 33 33 0 1 0 0 -33 Z";
const GRIN_SHAPE = "M 146 150 H 176 A 15 15 0 0 1 146 150 Z";
const BROW_SERIOUS = "M -16 1.5 Q 0 -2 16 -3.5 L 16 3 Q 0 2.5 -16 4.5 Z";
const BROW_EAGER = "M -16 -2 Q -2 -9 16 -1 L 16 2.5 Q -2 -3 -16 4.5 Z";
const STAR = (cx: number, cy: number, r: number): string =>
  `M${cx} ${cy - r} l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3} -${r * 0.7} ${r * 0.3} -${r * 0.3} ${r * 0.7} -${r * 0.3} -${r * 0.7} -${r * 0.7} -${r * 0.3} ${r * 0.7} -${r * 0.3} Z`;

function Body({ controller, palette, breath, reduced }: LayerProps): ReactElement {
  const { flags } = controller;
  const tween = useTween(reduced);
  const rawId = useId().replace(/:/g, "");
  const irisId = `mascotIris-${rawId}`;
  const lidId = `mascotLid-${rawId}`;
  const grinId = `mascotGrin-${rawId}`;

  // Pose targets
  const lidTopL = useSharedValue(10);
  const lidTopR = useSharedValue(0);
  const lidLow = useSharedValue(0);
  const browLy = useSharedValue(3);
  const browLr = useSharedValue(0);
  const browRy = useSharedValue(0);
  const browRr = useSharedValue(0);
  const mSmile = useSharedValue(1);
  const mHappy = useSharedValue(0);
  const mHappyScale = useSharedValue(0.5);
  const mO = useSharedValue(0);
  const mGrin = useSharedValue(0);
  const mFlat = useSharedValue(0);
  // Snap
  const splitDx = useSharedValue(0);
  const splitDr = useSharedValue(0);
  const splitBx = useSharedValue(0);
  const splitBr = useSharedValue(0);
  const eyeScale = useSharedValue(1);
  const pupilScale = useSharedValue(1);
  const ring = useSharedValue(0);
  const sparkA = useSharedValue(0);
  const sparkB = useSharedValue(0);
  const sparkC = useSharedValue(0);
  const okSpark = useSharedValue(0);
  const okTwinkle = useSharedValue(0);

  const lidBase = useRef({ l: 10, r: 0 });

  useEffect(() => {
    const pose: MascotPose = poseFor(flags);
    lidBase.current = { l: pose.lidTopL, r: pose.lidTopR };
    const closing = flags.covered || flags.peek;
    // Closing is quick; re-opening waits for the hands to move out of the way.
    lidTopL.value = closing
      ? tween(pose.lidTopL, 160, lidCloseEase)
      : reduced
        ? pose.lidTopL
        : withDelay(240, withTiming(pose.lidTopL, { duration: 220, easing: lidOpenEase }));
    lidTopR.value = closing
      ? tween(pose.lidTopR, 160, lidCloseEase)
      : reduced
        ? pose.lidTopR
        : withDelay(240, withTiming(pose.lidTopR, { duration: 220, easing: lidOpenEase }));
    lidLow.value = tween(pose.lidLow, 160, Easing.bezier(0.3, 0.9, 0.45, 1.12));
    browLy.value = tween(pose.browL.y, 240, browEase);
    browLr.value = tween(pose.browL.rot, 240, browEase);
    browRy.value = tween(pose.browR.y, 240, browEase);
    browRr.value = tween(pose.browR.rot, 240, browEase);
    mSmile.value = tween(pose.mouth === "smile" ? 1 : 0, 150);
    mHappy.value = tween(pose.mouth === "happy" ? 1 : 0, 150);
    mHappyScale.value = tween(
      pose.mouth === "happy" ? 1 : 0.5,
      180,
      Easing.bezier(0.34, 1.56, 0.5, 1),
    );
    mO.value = tween(pose.mouth === "o" ? 1 : 0, 150);
    mGrin.value = tween(pose.mouth === "grin" ? 1 : 0, 150);
    mFlat.value = tween(pose.mouth === "flat" ? 1 : 0, 150);
  }, [
    flags,
    tween,
    reduced,
    lidTopL,
    lidTopR,
    lidLow,
    browLy,
    browLr,
    browRy,
    browRr,
    mSmile,
    mHappy,
    mHappyScale,
    mO,
    mGrin,
    mFlat,
  ]);

  // E-mail valid: the sparkle twinkles.
  useEffect(() => {
    okSpark.value = tween(flags.valid ? 1 : 0, 300);
    if (flags.valid && !reduced) {
      okTwinkle.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      okTwinkle.value = 0;
    }
  }, [flags.valid, reduced, tween, okSpark, okTwinkle]);

  // The snap: pieces split, hold, click back; eyes widen; sparks + ring.
  useEffect(() => {
    if (!flags.snap || reduced) return;
    const S = SNAP_TIMELINE.split;
    const seq = (sign: 1 | -1): number =>
      withSequence(
        withTiming(-30 * sign, { duration: S * 0.2, easing: snapEase }),
        withTiming(-30 * sign, { duration: S * 0.28 }),
        withTiming(4 * sign, { duration: S * 0.2, easing: snapEase }),
        withTiming(-2 * sign, { duration: S * 0.14 }),
        withTiming(0, { duration: S * 0.18 }),
      );
    const rot = (sign: 1 | -1): number =>
      withSequence(
        withTiming(-2 * sign, { duration: S * 0.2, easing: snapEase }),
        withTiming(-2 * sign, { duration: S * 0.28 }),
        withTiming(0, { duration: S * 0.2, easing: snapEase }),
      );
    splitDx.value = seq(1);
    splitDr.value = rot(1);
    splitBx.value = seq(-1);
    splitBr.value = rot(-1);
    const wide = (from: number, to: number): number =>
      withSequence(
        withTiming(to, { duration: S * 0.2 }),
        withTiming(to, { duration: S * 0.28 }),
        withTiming(from, { duration: S * 0.16 }),
      );
    eyeScale.value = wide(1, 1.16);
    pupilScale.value = wide(1, 0.72);
    const pop = (delay: number): number =>
      withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 270 }),
        ),
      );
    sparkA.value = pop(620);
    sparkB.value = pop(680);
    sparkC.value = pop(740);
    ring.value = withDelay(
      620,
      withSequence(withTiming(1, { duration: 1 }), withTiming(0, { duration: 600 })),
    );
  }, [
    flags.snap,
    reduced,
    splitDx,
    splitDr,
    splitBx,
    splitBr,
    eyeScale,
    pupilScale,
    sparkA,
    sparkB,
    sparkC,
    ring,
  ]);

  // Blink: irregular cadence, sometimes double, never with the eyes covered.
  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const blocked = (): boolean => flags.covered || flags.peek || flags.snap || flags.happy;
    const blink = (): void => {
      if (blocked()) return;
      const { l, r } = lidBase.current;
      const shut = (base: number): number =>
        withSequence(
          withTiming(66, { duration: 122, easing: lidCloseEase }),
          withTiming(66, { duration: 48 }),
          withTiming(base, { duration: 170, easing: lidOpenEase }),
        );
      lidTopL.value = shut(l);
      lidTopR.value = shut(r);
    };
    const schedule = (): void => {
      timer = setTimeout(
        () => {
          blink();
          if (Math.random() < 0.25) setTimeout(blink, 450);
          schedule();
        },
        2400 + Math.random() * 3200,
      );
    };
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [flags, reduced, lidTopL, lidTopR]);

  /* animated props */
  const breathProps = useAnimatedProps(() => ({
    translateY: -5 * breath.value,
    rotation: -1.5 * breath.value,
  }));
  const darkProps = useAnimatedProps(() => ({
    translateX: splitDx.value,
    rotation: splitDr.value,
  }));
  const blueProps = useAnimatedProps(() => ({
    translateX: splitBx.value,
    rotation: splitBr.value,
  }));
  const browLProps = useAnimatedProps(() => ({ translateY: browLy.value, rotation: browLr.value }));
  const browRProps = useAnimatedProps(() => ({ translateY: browRy.value, rotation: browRr.value }));
  const smileProps = useAnimatedProps(() => ({ opacity: mSmile.value }));
  const happyProps = useAnimatedProps(() => ({ opacity: mHappy.value, scale: mHappyScale.value }));
  const oProps = useAnimatedProps(() => ({ opacity: mO.value }));
  const grinProps = useAnimatedProps(() => ({ opacity: mGrin.value }));
  const flatProps = useAnimatedProps(() => ({ opacity: mFlat.value }));
  const okProps = useAnimatedProps(() => ({
    opacity: okSpark.value,
    scale: 1 + 0.25 * okTwinkle.value,
    rotation: 12 * okTwinkle.value,
  }));
  const ringProps = useAnimatedProps(() => ({
    opacity: 0.9 * ring.value,
    scale: 1.5 - 1.25 * ring.value,
  }));
  const sparkAProps = useAnimatedProps(() => ({
    opacity: sparkA.value,
    scale: 0.2 + sparkA.value,
  }));
  const sparkBProps = useAnimatedProps(() => ({
    opacity: sparkB.value,
    scale: 0.2 + sparkB.value,
  }));
  const sparkCProps = useAnimatedProps(() => ({
    opacity: sparkC.value,
    scale: 0.2 + sparkC.value,
  }));

  return (
    <Svg width={MASCOT_WIDTH} height={BODY_HEIGHT} viewBox="-110 -60 500 310">
      <Defs>
        <ClipPath id={irisId}>
          <Circle r={28} />
        </ClipPath>
        <ClipPath id={lidId}>
          <Circle r={30} />
        </ClipPath>
        <ClipPath id={grinId}>
          <Path d={GRIN_SHAPE} />
        </ClipPath>
      </Defs>

      <AnimatedG animatedProps={breathProps} originX={140} originY={290}>
        {/* serious piece */}
        <AnimatedG animatedProps={darkProps} originX={70} originY={145}>
          {palette.seriousShadowOpacity > 0 ? (
            <Path
              d={SERIOUS_BODY}
              fill="#000000"
              opacity={palette.seriousShadowOpacity}
              translateY={7}
            />
          ) : null}
          <Path d={SERIOUS_BODY} fill={palette.serious} />
          <G transform="translate(100, 116)">
            <Eye
              lidTop={lidTopL}
              lidLow={lidLow}
              eyeScale={eyeScale}
              pupilScale={pupilScale}
              gazeX={controller.gazeX}
              gazeY={controller.gazeY}
              lidFill={palette.serious}
              palette={palette}
              irisId={irisId}
              lidId={lidId}
            />
          </G>
          <Ellipse cx={64} cy={152} rx={9} ry={5.5} fill={palette.blush} opacity={0.95} />
          <G transform="translate(100, 83)">
            <AnimatedG animatedProps={browLProps} originX={0} originY={0}>
              <Path d={BROW_SERIOUS} fill={palette.browOnSerious} />
            </AnimatedG>
          </G>
        </AnimatedG>

        {/* eager piece */}
        <AnimatedG animatedProps={blueProps} originX={200} originY={155}>
          <Path d={EAGER_BODY} fill={palette.eager} />
          <G transform="translate(222, 116)">
            <Eye
              lidTop={lidTopR}
              lidLow={lidLow}
              eyeScale={eyeScale}
              pupilScale={pupilScale}
              gazeX={controller.gazeX}
              gazeY={controller.gazeY}
              lidFill={palette.eager}
              palette={palette}
              irisId={irisId}
              lidId={lidId}
            />
          </G>
          <Ellipse cx={258} cy={152} rx={9} ry={5.5} fill={palette.blush} opacity={0.95} />
          <G transform="translate(222, 82)">
            <AnimatedG animatedProps={browRProps} originX={0} originY={0}>
              <Path d={BROW_EAGER} fill={palette.browOnEager} />
            </AnimatedG>
          </G>

          <AnimatedPath
            animatedProps={smileProps}
            d="M149 152 Q161 163 173 152"
            fill="none"
            stroke={palette.pupil}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <AnimatedPath
            animatedProps={happyProps}
            d="M147 150 Q161 171 175 150 Q161 156 147 150 Z"
            fill={palette.pupil}
            originX={161}
            originY={157}
          />
          <AnimatedCircle animatedProps={oProps} cx={161} cy={157} r={8.5} fill={palette.pupil} />
          <AnimatedG animatedProps={grinProps}>
            <Path d={GRIN_SHAPE} fill={palette.pupil} />
            <Ellipse
              cx={161}
              cy={166}
              rx={8}
              ry={5.5}
              fill={palette.blush}
              clipPath={`url(#${grinId})`}
            />
          </AnimatedG>
          <AnimatedPath
            animatedProps={flatProps}
            d="M151 156 H171"
            fill="none"
            stroke={palette.pupil}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </AnimatedG>

        <AnimatedPath
          animatedProps={okProps}
          d={STAR(256, 6, 14)}
          fill={palette.spark}
          originX={256}
          originY={6}
        />
      </AnimatedG>

      <AnimatedCircle
        animatedProps={ringProps}
        cx={140}
        cy={80}
        r={80}
        fill="none"
        stroke={palette.spark}
        strokeWidth={7}
        originX={140}
        originY={80}
      />
      <AnimatedPath
        animatedProps={sparkAProps}
        d={STAR(140, 0, 14)}
        fill={palette.spark}
        originX={140}
        originY={0}
      />
      <AnimatedPath
        animatedProps={sparkBProps}
        d={STAR(104, -11.5, 12.5)}
        fill={palette.spark}
        originX={104}
        originY={-11.5}
      />
      <AnimatedPath
        animatedProps={sparkCProps}
        d={STAR(178, -11, 11)}
        fill={palette.spark}
        originX={178}
        originY={-11}
      />
    </Svg>
  );
}

function Eye({
  lidTop,
  lidLow,
  eyeScale,
  pupilScale,
  gazeX,
  gazeY,
  lidFill,
  palette,
  irisId,
  lidId,
}: {
  lidTop: SharedValue<number>;
  lidLow: SharedValue<number>;
  eyeScale: SharedValue<number>;
  pupilScale: SharedValue<number>;
  gazeX: SharedValue<number>;
  gazeY: SharedValue<number>;
  lidFill: string;
  palette: MascotPalette;
  irisId: string;
  lidId: string;
}): ReactElement {
  const scaleProps = useAnimatedProps(() => ({ scale: eyeScale.value }));
  const pupilProps = useAnimatedProps(() => ({ scale: pupilScale.value }));
  const gazeProps = useAnimatedProps(() => ({ translateX: gazeX.value, translateY: gazeY.value }));
  const lidTopProps = useAnimatedProps(() => ({ translateY: lidTop.value }));
  const lidLowProps = useAnimatedProps(() => ({ translateY: lidLow.value }));
  return (
    <AnimatedG animatedProps={scaleProps} originX={0} originY={0}>
      <Circle r={28} fill={palette.sclera} />
      {/* pupil + glint stay inside the sclera; lids slide over inside a 2px-larger clip */}
      <G clipPath={`url(#${irisId})`}>
        <AnimatedG animatedProps={gazeProps}>
          <AnimatedG animatedProps={pupilProps} originX={0} originY={0}>
            <Circle r={13} fill={palette.pupil} />
          </AnimatedG>
          <Circle cx={7.5} cy={-9} r={4.5} fill="#FFFFFF" />
        </AnimatedG>
      </G>
      <G clipPath={`url(#${lidId})`}>
        <AnimatedG animatedProps={lidLowProps}>
          <Circle
            cy={72}
            r={40}
            fill={lidFill}
            stroke={palette.pupil}
            strokeWidth={2.5}
            strokeOpacity={0.35}
          />
        </AnimatedG>
        <AnimatedG animatedProps={lidTopProps}>
          <Path
            d={LID_SHAPE}
            fillRule="evenodd"
            fill={lidFill}
            stroke={palette.pupil}
            strokeWidth={2.5}
            strokeOpacity={0.35}
          />
        </AnimatedG>
      </G>
    </AnimatedG>
  );
}

/* ---------------------------- Arms ------------------------------- */

const PALM = "M -18 -8 H 18 Q 19 6 12 14 Q 4 21 -6 20 Q -16 19 -18 8 Z";
const THUMB = "M -3.4 0 L -2.9 -12 A 2.9 2.9 0 0 1 2.9 -12 L 3.4 0 Z";

function Finger({
  x,
  angle,
  length,
  factor,
  curl,
}: {
  x: number;
  angle: number;
  length: number;
  factor: number;
  curl: SharedValue<number>;
}): ReactElement {
  const props = useAnimatedProps(() => ({ rotation: curl.value * factor }));
  return (
    <G transform={`translate(${x}, -7) rotate(${angle})`}>
      <AnimatedG animatedProps={props} originX={0} originY={0}>
        <Path d={fingerPath(length)} />
      </AnimatedG>
    </G>
  );
}

function HandShapes({ curl }: { curl: SharedValue<number> }): ReactElement {
  const thumbProps = useAnimatedProps(() => ({ rotation: curl.value * THUMB_CURL_FACTOR }));
  return (
    <>
      <Path d={PALM} />
      <G transform="translate(-15, 6) rotate(-62)">
        <AnimatedG animatedProps={thumbProps} originX={0} originY={0}>
          <Path d={THUMB} />
        </AnimatedG>
      </G>
      {FINGERS.map((f) => (
        <Finger
          key={f.x}
          x={f.x}
          angle={f.angle}
          length={f.length}
          factor={f.curlFactor}
          curl={curl}
        />
      ))}
    </>
  );
}

/** Palm + thumb + four fingers, with a rim so it reads on a same-colour piece. */
function Hand({
  fill,
  rim,
  curl,
}: {
  fill: string;
  rim: string;
  curl: SharedValue<number>;
}): ReactElement {
  return (
    <>
      <G fill={rim} stroke={rim} strokeWidth={3} strokeLinejoin="round">
        <HandShapes curl={curl} />
      </G>
      <G fill={fill}>
        <HandShapes curl={curl} />
      </G>
      {/* cuff: covers the rim where the forearm enters and merges with it */}
      <Rect x={-16} y={10} width={22} height={18} fill={fill} />
    </>
  );
}

function Arm({
  side,
  color,
  rim,
  upper,
  fore,
  hand,
  curl,
  breath,
}: {
  side: "L" | "R";
  color: string;
  rim: string;
  upper: SharedValue<number>;
  fore: SharedValue<number>;
  hand: SharedValue<number>;
  curl: SharedValue<number>;
  breath: SharedValue<number>;
}): ReactElement {
  const shoulderProps = useAnimatedProps(() => ({ translateY: -5 * breath.value }));
  const elbowProps = useAnimatedProps(() => ({ translateY: 5 * breath.value }));
  const upperLimbProps = useAnimatedProps(() => ({ d: `M 0 0 V ${84 + 5 * breath.value}` }));
  const upperProps = useAnimatedProps(() => ({ rotation: upper.value }));
  const foreProps = useAnimatedProps(() => ({ rotation: fore.value }));
  const handProps = useAnimatedProps(() => ({ rotation: hand.value }));
  const shoulderX = side === "L" ? 8 : 272;
  const mitt =
    side === "L"
      ? "translate(5.75, -20.7) scale(1.15)"
      : "translate(-5.75, -20.7) scale(-1.15, 1.15)";
  return (
    <AnimatedG animatedProps={shoulderProps}>
      <G transform={`translate(${shoulderX}, 150)`}>
        <AnimatedG animatedProps={upperProps} originX={0} originY={0}>
          <AnimatedPath
            animatedProps={upperLimbProps}
            fill="none"
            stroke={color}
            strokeWidth={24}
            strokeLinecap="round"
          />
          <G transform="translate(0, 84)">
            <AnimatedG animatedProps={elbowProps}>
              <AnimatedG animatedProps={foreProps} originX={0} originY={0}>
                <Path
                  d="M 0 0 V 78"
                  fill="none"
                  stroke={color}
                  strokeWidth={24}
                  strokeLinecap="round"
                />
                <G transform="translate(0, 84)">
                  <AnimatedG animatedProps={handProps} originX={0} originY={0}>
                    <G transform={mitt}>
                      <Hand fill={color} rim={rim} curl={curl} />
                    </G>
                  </AnimatedG>
                </G>
              </AnimatedG>
            </AnimatedG>
          </G>
        </AnimatedG>
      </G>
    </AnimatedG>
  );
}

function Arms({ controller, palette, breath, reduced }: LayerProps): ReactElement {
  const { flags } = controller;
  const tween = useTween(reduced);
  const rest = poseFor(IDLE_FLAGS);
  const uL = useSharedValue(rest.armL.upper);
  const fL = useSharedValue(rest.armL.fore);
  const hL = useSharedValue(rest.armL.hand);
  const uR = useSharedValue(rest.armR.upper);
  const fR = useSharedValue(rest.armR.fore);
  const hR = useSharedValue(rest.armR.hand);
  const curl = useSharedValue(rest.curl);

  useEffect(() => {
    const pose = poseFor(flags);
    // Shoulder leads, elbow and wrist follow a beat behind.
    const joint = (v: number, delay: number): number =>
      reduced ? v : withDelay(delay, withTiming(v, { duration: 460, easing: armEase }));
    uL.value = joint(pose.armL.upper, 0);
    fL.value = joint(pose.armL.fore, 40);
    hL.value = joint(pose.armL.hand, 80);
    uR.value = joint(pose.armR.upper, 0);
    fR.value = joint(pose.armR.fore, 40);
    hR.value = joint(pose.armR.hand, 80);
    curl.value = tween(pose.curl, 400, browEase);
  }, [flags, reduced, tween, uL, fL, hL, uR, fR, hR, curl]);

  return (
    <Svg width={MASCOT_WIDTH} height={ARMS_HEIGHT} viewBox="-110 -60 500 380">
      <Arm
        side="L"
        color={palette.serious}
        rim={palette.rimOnSerious}
        upper={uL}
        fore={fL}
        hand={hL}
        curl={curl}
        breath={breath}
      />
      <Arm
        side="R"
        color={palette.eager}
        rim={palette.rimOnEager}
        upper={uR}
        fore={fR}
        hand={hR}
        curl={curl}
        breath={breath}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  body: {
    position: "absolute",
    top: LAYER_TOP,
    left: "50%",
    marginLeft: -MASCOT_WIDTH / 2,
    width: MASCOT_WIDTH,
    height: BODY_HEIGHT,
    zIndex: 0,
  },
  arms: {
    position: "absolute",
    top: LAYER_TOP,
    left: "50%",
    marginLeft: -MASCOT_WIDTH / 2,
    width: MASCOT_WIDTH,
    height: ARMS_HEIGHT,
    zIndex: 2,
  },
});
