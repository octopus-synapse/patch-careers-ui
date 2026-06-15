/**
 * Shared presentational chrome for the settings feature: the standalone screen
 * shell (slim back bar + centered serif title), small-caps section headers,
 * surface cards, navigable rows, and the generic pill selector. All themed via
 * `useSet()` + the editorial palette.
 */

import { Icon, Text, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/providers/i18n-provider";
import { useSet } from "../lib/styles";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

/** Standalone screen frame: back bar (own exit) + centered title + scroll body. */
export function SettingsScreenShell({
  title,
  children,
  scroll = true,
}: {
  title: string;
  children: ReactNode;
  /** Set false when the screen renders its own list/scroll (e.g. FlatList). */
  scroll?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const styles = useSet();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  const goBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  };

  const header = (
    <XStack alignItems="center" height={48} paddingHorizontal={8}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={goBack}
        hitSlop={8}
        style={styles.backButton}
      >
        <Icon as={ChevronLeft} size={26} color={palette.ink} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.backButton} />
    </XStack>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}

export function SectionHeader({ label }: { label: string }): ReactElement {
  const styles = useSet();
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

export function SettingsCard({ children }: { children: ReactNode }): ReactElement {
  const styles = useSet();
  return <View style={styles.card}>{children}</View>;
}

/** Navigable row: leading icon · label · optional trailing value/badge · chevron. */
export function SettingsRow({
  icon: RowIcon,
  label,
  value,
  badge,
  onPress,
  first = false,
  danger = false,
}: {
  icon: Glyph;
  label: string;
  value?: string | undefined;
  badge?: string | undefined;
  onPress: () => void;
  first?: boolean;
  danger?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const styles = useSet();
  const tint = danger ? palette.danger : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        first ? null : styles.rowDivider,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <RowIcon size={20} color={danger ? palette.danger : palette.body} strokeWidth={1.75} />
      <Text style={[styles.rowLabel, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
      {badge ? <Text style={styles.rowBadge}>{badge}</Text> : null}
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {danger ? null : <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />}
    </Pressable>
  );
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
