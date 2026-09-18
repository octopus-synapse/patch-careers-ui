import {
  Button,
  IconButton,
  Input,
  ModalHeader,
  Sheet,
  Text,
  XStack,
  YStack,
} from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { monthLabel, parseYearMonth } from "../lib/helpers";
import { useEd } from "../lib/styles";

const MIN_YEAR = 1950;
const MONTH_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
] as const;

/** Shared section date picker: editable year, bounded navigation and month selection. */
export function MonthYearPicker({
  allowEmpty,
  clearLabel,
  futureYears = 0,
  onChange,
  onClose,
  title,
  value,
  visible,
}: {
  allowEmpty: boolean;
  clearLabel: string;
  futureYears?: number;
  onChange: (value: string) => void;
  onClose: () => void;
  title: string;
  value: string;
  visible: boolean;
}) {
  const ed = useEd();
  const palette = useEditorialPalette();
  const { locale, t } = useI18n();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const maxYear = currentYear + futureYears;
  const selected = parseYearMonth(value);
  const [yearText, setYearText] = useState(String(selected?.year ?? currentYear));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const initialYear = parseYearMonth(value)?.year ?? currentYear;
    setYearText(String(Math.min(maxYear, Math.max(MIN_YEAR, initialYear))));
    setTouched(false);
  }, [visible, value, currentYear, maxYear]);

  const year = Number(yearText);
  const validYear = /^\d{4}$/.test(yearText) && year >= MIN_YEAR && year <= maxYear;
  const showError = !validYear && (touched || yearText.length === 4);
  const yearError = t("onboarding.date.yearRange", { min: MIN_YEAR, max: maxYear });

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      closeLabel={t("app.confirmDialog.close")}
      presentation="card"
      webMaxWidth={520}
    >
      <ScrollView style={ed.editorialModalScroll} keyboardShouldPersistTaps="handled">
        <YStack paddingVertical={8} paddingHorizontal={8} gap={32}>
          <ModalHeader title={title} closeLabel={t("app.confirmDialog.close")} onClose={onClose} />

          <YStack gap={12}>
            <XStack alignItems="center" justifyContent="center" gap={20}>
              <YearStepButton
                direction="previous"
                disabled={!validYear || year <= MIN_YEAR}
                onPress={() => setYearText(String(year - 1))}
              />
              <Input
                value={yearText}
                onChangeText={(text: string) => {
                  setYearText(text.replace(/\D/g, "").slice(0, 4));
                  setTouched(false);
                }}
                onBlur={() => setTouched(true)}
                accessibilityLabel={t("onboarding.date.year")}
                error={showError ? yearError : undefined}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={4}
                selectTextOnFocus
                textAlign="center"
                fontFamily={editorialFonts.mono}
                fontSize={24}
                color={palette.ink}
                backgroundColor={palette.surface}
                borderColor={showError ? palette.danger : palette.hairlineStrong}
                borderWidth={1}
                borderRadius={16}
                width={152}
                minWidth={0}
                flexShrink={1}
                height={60}
              />
              <YearStepButton
                direction="next"
                disabled={!validYear || year >= maxYear}
                onPress={() => setYearText(String(year + 1))}
              />
            </XStack>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={13}
              lineHeight={20}
              textAlign="center"
              color={showError ? palette.danger : palette.muted}
              accessibilityLiveRegion="polite"
            >
              {showError ? yearError : t("onboarding.date.yearHint")}
            </Text>
          </YStack>

          <YStack gap={12}>
            {MONTH_ROWS.map((months) => (
              <XStack key={months[0]} gap={12}>
                {months.map((month) => {
                  const isSelected = selected?.month === month && selected.year === year;
                  const disabled =
                    !validYear ||
                    (futureYears === 0 && year === currentYear && month > currentMonth);
                  return (
                    <Button
                      key={month}
                      variant="outlined"
                      intent="neutral"
                      size="sm"
                      flex={1}
                      flexBasis={0}
                      minWidth={0}
                      height={52}
                      minHeight={52}
                      paddingHorizontal={0}
                      borderRadius={999}
                      borderColor={isSelected ? palette.ink : palette.hairline}
                      backgroundColor={isSelected ? palette.ink : palette.surface}
                      color={isSelected ? palette.surface : palette.body}
                      fontFamily={editorialFonts.sans}
                      fontSize={15}
                      textTransform="capitalize"
                      accessibilityLabel={monthLabel(
                        validYear ? year : currentYear,
                        month,
                        locale,
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                      accessibilityState={{ selected: isSelected, disabled }}
                      disabled={disabled}
                      onPress={() => onChange(`${year}-${String(month).padStart(2, "0")}-01`)}
                    >
                      {monthLabel(2020, month, locale, { month: "short" })}
                    </Button>
                  );
                })}
              </XStack>
            ))}
          </YStack>

          {allowEmpty ? (
            <YStack paddingTop={16} borderTopWidth={1} borderColor={palette.hairline}>
              <Button
                variant="ghost"
                intent="neutral"
                size="sm"
                minHeight={48}
                borderRadius={999}
                color={palette.muted}
                onPress={() => onChange("")}
              >
                {clearLabel}
              </Button>
            </YStack>
          ) : null}
        </YStack>
      </ScrollView>
    </Sheet>
  );
}

function YearStepButton({
  direction,
  disabled,
  onPress,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onPress: () => void;
}) {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <IconButton
      variant="outlined"
      intent="neutral"
      size="sm"
      width={48}
      height={48}
      flexShrink={0}
      padding={0}
      borderRadius={999}
      borderColor={palette.hairline}
      backgroundColor={palette.surface}
      accessibilityLabel={t(
        direction === "previous" ? "onboarding.date.prevYear" : "onboarding.date.nextYear",
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon size={20} color={palette.ink} />
    </IconButton>
  );
}
