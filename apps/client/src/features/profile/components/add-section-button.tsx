import { PillButton } from "@patch-careers/ui/editorial";
import { Plus } from "lucide-react-native";
import type { ReactElement } from "react";

export function AddSectionButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}): ReactElement {
  return (
    <PillButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      minHeight={54}
      fullWidth
      renderIcon={({ color, size }) => <Plus size={size} color={color} strokeWidth={2.25} />}
    />
  );
}
