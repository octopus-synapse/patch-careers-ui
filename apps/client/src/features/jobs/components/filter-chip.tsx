/**
 * Editorial pill chip (34px, hairline border, ink fill when selected) —
 * shared by the filter sheet's option groups and the removable
 * active-filter row (`removable` adds a trailing X glyph).
 */

import { Icon, Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

export function FilterChip({
  label,
  selected = false,
  removable = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  removable?: boolean;
  onPress: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={removable ? `Remover filtro ${label}` : `Filtro ${label}`}
      onPress={onPress}
      // Visual height is 34 — extend the hit area to the 44pt minimum.
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      style={({ pressed }) => ({
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 6,
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        justifyContent: "center" as const,
        borderColor: selected ? editorialPalette.primary : editorialPalette.hairlineStrong,
        backgroundColor: selected
          ? editorialPalette.primary
          : pressed
            ? editorialPalette.bg
            : editorialPalette.surface,
      })}
    >
      <Text
        preset="caption"
        fontSize={13}
        fontWeight={selected ? "600" : "400"}
        color={selected ? editorialPalette.onPrimary : editorialPalette.body}
      >
        {label}
      </Text>
      {removable ? (
        <View>
          <Icon
            as={X}
            size={13}
            color={selected ? editorialPalette.onPrimary : editorialPalette.muted}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
