/**
 * Settings-only presentational chrome: the small-caps section header and the
 * generic single-select pill group. The shared surface + navigable row
 * (`SettingsCard`/`SettingsRow`) now live in `@patch-careers/ui`, and the
 * screen shell (`SettingsScreenShell`) in `@/components` — both are reused by
 * the Profile tab too (ADR-0010). These two stay here because only the settings
 * screens use them. All themed via `useSet()` + the editorial palette.
 */

import { Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ComponentType, ReactElement } from "react";
import { Pressable, View } from "react-native";
import { useSet } from "../lib/styles";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

export function SectionHeader({ label }: { label: string }): ReactElement {
  const styles = useSet();
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

export interface PillOption<T extends string> {
  value: T;
  label: string;
  icon?: Glyph;
}

/** Generic single-select pill group (the theme-pill visual), reused for theme,
 *  profile visibility, message privacy, and language. */
export function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<PillOption<T>>;
  value: T;
  onChange: (next: T) => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const styles = useSet();
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const OptionIcon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            onPress={() => onChange(opt.value)}
            style={[styles.pill, selected ? styles.pillSelected : null]}
          >
            {OptionIcon ? (
              <OptionIcon
                size={15}
                color={selected ? palette.ink : palette.muted}
                strokeWidth={1.75}
              />
            ) : null}
            <Text style={[styles.pillLabel, selected ? styles.pillLabelSelected : null]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
