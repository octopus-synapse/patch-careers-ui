/**
 * Small editorial building blocks shared by the section editor and the
 * onboarding wizard chrome (extracted verbatim from `OnboardingWizard.tsx`).
 */
import { editorialPalette as authTokens } from "@patch-careers/tokens";
import { FieldError } from "@patch-careers/ui/editorial";
import { Plus } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { ed } from "./styles";

export function GhostButton({
  danger,
  disabled,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={ed.ghost}
    >
      <Text style={[ed.ghostLabel, danger ? ed.ghostDanger : null, disabled ? ed.dim : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FieldLabel({
  children,
  error,
}: {
  children: ReactNode;
  error?: boolean;
}): ReactElement {
  return <Text style={[ed.fieldLabel, error ? ed.fieldLabelError : null]}>{children}</Text>;
}

/**
 * Label + control + hairline underline + error — the shape the textarea
 * and date fields each hand-rolled, mirroring the editorial UnderlineInput.
 */
export function FieldShell({
  label,
  error,
  focused = false,
  children,
}: {
  label: string;
  error?: string | undefined;
  focused?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <View>
      <FieldLabel error={Boolean(error)}>{label}</FieldLabel>
      {children}
      <View
        style={[
          ed.fieldLine,
          focused ? ed.fieldLineFocused : null,
          error ? ed.fieldLineError : null,
        ]}
      />
      {error ? <FieldError text={error} /> : null}
    </View>
  );
}

export function OptionPill({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[ed.pill, selected ? ed.pillSelected : null]}
    >
      <Text style={[ed.pillLabel, selected ? ed.pillLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * "Plus (or spinner) + label" affordance — the add row the multi-item list,
 * the section empty state and the review hub each hand-rolled.
 */
export function AddRow({
  label,
  onPress,
  style,
  labelStyle,
  loading = false,
  disabled = false,
  iconSize = 15,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
  iconSize?: number;
}): ReactElement {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={style}>
      {loading ? (
        <ActivityIndicator size="small" color={authTokens.ink} />
      ) : (
        <Plus size={iconSize} color={authTokens.ink} strokeWidth={2} />
      )}
      <Text style={labelStyle ?? ed.addLabel}>{label}</Text>
    </Pressable>
  );
}

/**
 * Full-screen RN `<Modal>` with the shared transparent / fade / scrim prop
 * set the onboarding modals each repeated; callers supply the scrim + card.
 */
export function OverlayModal({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
}): ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  );
}
