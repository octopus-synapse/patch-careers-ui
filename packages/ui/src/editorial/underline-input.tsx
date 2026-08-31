/**
 * UnderlineInput — hairline-bottom input with an animated focus underline.
 *
 * Layout/label are Tamagui; the editable field stays a bare RN `TextInput`
 * (ref forwarding, selection/cursor color, web outline removal). Focus is a
 * quiet crossfade: the hairline brightens into the accent and the label
 * warms from muted to ink — no growing/sliding line, no floating label.
 */

import {
  forwardRef,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type KeyboardTypeOptions,
  type NativeSyntheticEvent,
  Platform,
  type ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
  type TextInputSelectionChangeEventData,
  type TextInputSubmitEditingEventData,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { resolveUnderlineColors } from "../internal/editorial-variants";
import { TStack, TXStack, TYStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";

const isWeb = Platform.OS === "web";

// Floating-label geometry. The label is laid out in its lifted slot (a
// LABEL_H band above the row) and, at rest, is translated down into the
// input and scaled up to the input's type size — so the two states share one
// element and the spring carries it between them (no re-layout, no jump).
const LABEL_SIZE = isWeb ? 14 : 13;
const INPUT_SIZE = isWeb ? 19 : 18;
const LABEL_H = LABEL_SIZE + 6;
const ROW_H = isWeb ? 44 : 40;
const LABEL_REST_SCALE = INPUT_SIZE / LABEL_SIZE;
const LABEL_REST_Y = LABEL_H / 2 + ROW_H / 2 - LABEL_SIZE / 2 + 2;
const LIFT_SPRING = { damping: 20, stiffness: 240, mass: 0.7 };
const AUTOFILL_PROBE_MS = [0, 120, 400, 1000, 2500];
const AUTOFILL_ON_ANIM = "patchAutofillOn";
const AUTOFILL_OFF_ANIM = "patchAutofillOff";

export type UnderlineInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "password" | "new-password" | "username" | "name" | "off";
  textContentType?:
    | "emailAddress"
    | "password"
    | "newPassword"
    | "username"
    | "name"
    | "oneTimeCode";
  autoCorrect?: boolean;
  autoFocus?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  blurOnSubmit?: boolean;
  secureTextEntry?: boolean;
  editable?: boolean;
  hasError?: boolean;
  /** Slot for an action icon at the right edge of the input row. */
  rightSlot?: ReactNode;
  /** Observers only — the focus crossfade stays internal. */
  onFocus?: () => void;
  onBlur?: () => void;
  /** Caret position, for callers that follow the cursor (e.g. the auth mascot). */
  onSelectionChange?: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
};

export const UnderlineInput = forwardRef<TextInput, UnderlineInputProps>(
  (
    {
      label,
      value,
      onChangeText,
      hasError = false,
      rightSlot,
      testID,
      placeholder,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ): ReactElement => {
    const [focused, setFocused] = useState(false);
    const editorialPalette = useEditorialPalette();

    // Web autofill. Two cases the form never hears about:
    //  · a restored/committed value written straight into the DOM node — read
    //    it back a few times after mount and push it into the form;
    //  · Chrome's autofill *preview* (after F5 with saved credentials): the
    //    node matches `:-webkit-autofill` and paints the text, but `value`
    //    stays "" until the user interacts. Detected via the keyframe hook
    //    below (`animationstart` fires when the pseudo-class flips), and
    //    treated as "has content" so the label lifts out of the way.
    const [autofilled, setAutofilled] = useState(false);
    const nodeRef = useRef<TextInput | null>(null);
    const latest = useRef({ value, onChangeText });
    latest.current = { value, onChangeText };
    const setRefs = useCallback(
      (node: TextInput | null) => {
        nodeRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    useEffect(() => {
      if (!isWeb) return;
      const sync = (): void => {
        const dom = nodeRef.current as unknown as { value?: string } | null;
        const domValue = dom?.value;
        if (typeof domValue === "string" && domValue !== "" && latest.current.value === "") {
          latest.current.onChangeText(domValue);
        }
        // The keyframe hook can fire before this effect subscribes; poll the
        // pseudo-class on the probes too.
        const el = nodeRef.current as unknown as Element | null;
        try {
          if (el?.matches(":-webkit-autofill")) setAutofilled(true);
        } catch {
          /* selector unsupported (non-WebKit) */
        }
      };
      const timers = AUTOFILL_PROBE_MS.map((ms) => setTimeout(sync, ms));
      const node = nodeRef.current as unknown as HTMLElement | null;
      const onAnim = (e: Event): void => {
        const name = (e as AnimationEvent).animationName;
        if (name === AUTOFILL_ON_ANIM) setAutofilled(true);
        else if (name === AUTOFILL_OFF_ANIM) setAutofilled(false);
        sync();
      };
      node?.addEventListener("animationstart", onAnim);
      return () => {
        for (const t of timers) clearTimeout(t);
        node?.removeEventListener("animationstart", onAnim);
      };
    }, []);
    const colors = resolveUnderlineColors(editorialPalette, hasError);

    // 0 = resting inside the field (empty, unfocused) · 1 = lifted above it.
    const lifted = focused || value.length > 0 || autofilled;
    const lift = useSharedValue(lifted ? 1 : 0);
    // 0 = blurred · 1 = focused — drives the underline + label colour.
    const focus = useSharedValue(focused ? 1 : 0);

    useEffect(() => {
      lift.value = withSpring(lifted ? 1 : 0, LIFT_SPRING);
    }, [lifted, lift]);
    useEffect(() => {
      focus.value = withTiming(focused ? 1 : 0, {
        duration: 240,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, [focused, focus]);

    const restColor = hasError ? editorialPalette.danger : editorialPalette.muted;
    const liftedColor = hasError ? editorialPalette.danger : editorialPalette.body;
    const focusColor = hasError ? editorialPalette.danger : editorialPalette.ink;

    const labelStyle = useAnimatedStyle(() => {
      const base = interpolateColor(lift.value, [0, 1], [restColor, liftedColor]);
      return {
        transform: [
          { translateY: interpolate(lift.value, [0, 1], [LABEL_REST_Y, 0]) },
          { scale: interpolate(lift.value, [0, 1], [LABEL_REST_SCALE, 1]) },
        ],
        color: interpolateColor(focus.value, [0, 1], [base, focusColor]),
      };
    });
    const underlineStyle = useAnimatedStyle(() => ({
      opacity: focus.value,
      backgroundColor: colors.focus,
    }));

    return (
      <TYStack paddingTop={LABEL_H}>
        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          style={[inputStyles.label, labelStyle]}
        >
          {label}
        </Animated.Text>
        <TXStack alignItems="center" minHeight={ROW_H}>
          <TextInput
            ref={setRefs}
            value={value}
            onChangeText={onChangeText}
            style={[inputStyles.input, { color: editorialPalette.ink }]}
            // Placeholder only once the label has moved out of the way.
            placeholder={focused && !autofilled ? placeholder : undefined}
            // Web: tag the node so the autofill reset below can target it.
            {...(isWeb ? { dataSet: { editorialInput: "" } } : {})}
            placeholderTextColor={editorialPalette.subtle}
            onFocus={() => {
              setFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            selectionColor={editorialPalette.accent}
            cursorColor={editorialPalette.accent}
            {...(testID ? { testID } : {})}
            {...rest}
          />
          {rightSlot ? <TStack paddingLeft={8}>{rightSlot}</TStack> : null}
        </TXStack>
        <TStack height={1} width="100%" backgroundColor={colors.hairline} />
        <Animated.View style={[inputStyles.focusLine, underlineStyle]} />
      </TYStack>
    );
  },
);
UnderlineInput.displayName = "UnderlineInput";

// RN-primitive styles (the bare TextInput + absolute focus line). Everything
// else is expressed with Tamagui props above.
const inputStyles = StyleSheet.create({
  label: {
    position: "absolute",
    left: 0,
    top: 0,
    fontFamily: editorialFonts.sans,
    fontSize: LABEL_SIZE,
    lineHeight: LABEL_H,
    fontWeight: "500",
    letterSpacing: 0.1,
    transformOrigin: "left center",
  },
  input: {
    flex: 1,
    fontFamily: editorialFonts.sans,
    fontSize: INPUT_SIZE,
    paddingVertical: isWeb ? 10 : 8,
    paddingHorizontal: 0,
    // Remove default RN-Web input outline.
    ...Platform.select({
      web: { outlineStyle: "none" as unknown as undefined },
      default: {},
    }),
  },
  focusLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
  },
});

// Chrome paints autofilled inputs with its own opaque (navy-on-dark) box;
// an effectively infinite background transition keeps our transparent field.
// Runtime-injected because `+html.tsx` is not served in dev/single output.
const AUTOFILL_STYLE_ID = "patch-editorial-input-autofill";
if (isWeb && typeof document !== "undefined" && !document.getElementById(AUTOFILL_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = AUTOFILL_STYLE_ID;
  style.textContent =
    "[data-editorial-input]:-webkit-autofill,[data-editorial-input]:-webkit-autofill:hover," +
    "[data-editorial-input]:-webkit-autofill:focus{transition:background-color 9999999s ease-in-out 0s;" +
    "-webkit-text-fill-color:currentColor;caret-color:currentColor;font:inherit;}" +
    // Zero-length keyframes whose only job is to fire `animationstart` when
    // the autofill pseudo-class toggles (the value itself is unreadable).
    `@keyframes ${AUTOFILL_ON_ANIM}{from{opacity:.999}to{opacity:1}}` +
    `@keyframes ${AUTOFILL_OFF_ANIM}{from{opacity:.999}to{opacity:1}}` +
    `[data-editorial-input]:-webkit-autofill{animation:${AUTOFILL_ON_ANIM} 1ms;}` +
    `[data-editorial-input]:not(:-webkit-autofill){animation:${AUTOFILL_OFF_ANIM} 1ms;}`;
  document.head.appendChild(style);
}
