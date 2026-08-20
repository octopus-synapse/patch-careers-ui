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
import { useState } from "react";
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

/** Contained segmented control from the approved settings-web-demo: a hairline
 *  track on the panel tone; the active segment fills with ink. */
export function SegmentedSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<PillOption<T>>;
  value: T;
  onChange: (next: T) => void;
}): ReactElement {
  const styles = useSet();
  return (
    <View style={styles.segTrack}>
      {options.map((opt) => (
        <SegmentedOption
          key={opt.value}
          option={opt}
          selected={opt.value === value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}

function SegmentedOption<T extends string>({
  option,
  selected,
  onPress,
}: {
  option: PillOption<T>;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const styles = useSet();
  const [hovered, setHovered] = useState(false);
  const OptionIcon = option.icon;
  const labelStyle = [
    styles.segLabel,
    hovered && !selected ? styles.segLabelHovered : null,
    selected ? styles.segLabelSelected : null,
  ];
  const iconColor = selected ? palette.bg : hovered ? palette.ink : palette.muted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.segOption, selected ? styles.segOptionSelected : null]}
    >
      {OptionIcon ? <OptionIcon size={13} color={iconColor} strokeWidth={2} /> : null}
      <Text style={labelStyle}>{option.label}</Text>
    </Pressable>
  );
}

/** Desktop-web setting row (settings-web-demo): sentence-case label plus a
 *  muted description on the left, a segmented control on the right. */
export function SettingSelectRow<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  first = false,
}: {
  label: string;
  description: string;
  options: ReadonlyArray<PillOption<T>>;
  value: T;
  onChange: (next: T) => void;
  first?: boolean;
}): ReactElement {
  const styles = useSet();
  return (
    <View style={[styles.selectRow, first ? null : styles.selectRowDivider]}>
      <View style={styles.selectRowText}>
        <Text style={styles.selectRowLabel}>{label}</Text>
        <Text style={styles.selectRowDescription}>{description}</Text>
      </View>
      <SegmentedSelect<T> options={options} value={value} onChange={onChange} />
    </View>
  );
}
