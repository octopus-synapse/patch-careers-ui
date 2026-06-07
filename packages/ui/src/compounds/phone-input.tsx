/**
 * `<PhoneInput>` — country selector + live-masked national number.
 *
 * The user picks a country (dial code) from a searchable sheet, then types
 * the number; the field renders the pretty national mask (e.g.
 * `(11) 97883-3101`) while the component emits the canonical
 * `+<dial><national>` string the backend stores.
 *
 * The country sheet is rendered through the shared `<ListPicker>` so the
 * sheet/search/row scaffolding lives in one place.
 *
 * Router/data-agnostic — pure presentational compound. Phone formatting lives
 * in `internal/phone-mask`.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import {
  DEFAULT_PHONE_COUNTRY,
  findCountryByIso,
  formatNational,
  onlyDigits,
  PHONE_COUNTRIES,
  type PhoneCountry,
  parseCanonicalPhone,
  toCanonicalPhone,
} from "../internal/phone-mask";
import { Input } from "../primitives/input";
import { Label } from "../primitives/label";
import { Pill } from "../primitives/pill";
import { XStack, YStack } from "../primitives/stack";
import { Text } from "../primitives/text";
import { ListPicker, type ListPickerOption } from "./list-picker";

export interface PhoneInputProps {
  label: string;
  /** Canonical `+<dial><national>` value (server shape). */
  value: string;
  onChange: (canonical: string) => void;
  /** ISO code to default the country to (e.g. from the location step). */
  defaultCountryIso?: string;
  /** Bubbles the chosen ISO up so the wizard can keep it sticky across steps. */
  onCountryChange?: (iso: string) => void;
  placeholder?: string;
  error?: string | undefined;
}

export function PhoneInput({
  label,
  value,
  onChange,
  defaultCountryIso,
  onCountryChange,
  placeholder,
  error,
}: PhoneInputProps) {
  const [country, setCountry] = useState<PhoneCountry>(() => {
    const parsed = parseCanonicalPhone(value);
    if (parsed.national.length > 0) return parsed.country;
    return findCountryByIso(defaultCountryIso) ?? DEFAULT_PHONE_COUNTRY;
  });
  const [national, setNational] = useState<string>(() => parseCanonicalPhone(value).national);
  const [open, setOpen] = useState(false);

  // Track what we last emitted so an external value change (e.g. a draft
  // loading asynchronously) re-syncs us, but our own emits don't.
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const parsed = parseCanonicalPhone(value);
    setCountry(parsed.country);
    setNational(parsed.national);
  }, [value]);

  // Follow a late-arriving default country (derived from location/locale) while
  // the user hasn't typed a number yet — keeps the picker in sync without
  // overriding an explicit choice.
  useEffect(() => {
    if (!defaultCountryIso || national.length > 0) return;
    const found = findCountryByIso(defaultCountryIso);
    if (found && found.iso !== country.iso) setCountry(found);
  }, [defaultCountryIso, national.length, country.iso]);

  const emit = (c: PhoneCountry, n: string) => {
    const canonical = toCanonicalPhone(c, n);
    lastEmitted.current = canonical;
    onChange(canonical);
  };

  const onChangeNational = (text: string) => {
    const digits = onlyDigits(text);
    setNational(digits);
    emit(country, digits);
  };

  const pickCountry = (iso: string) => {
    const c = findCountryByIso(iso);
    if (!c) return;
    setCountry(c);
    setOpen(false);
    emit(c, national);
    onCountryChange?.(c.iso);
  };

  const countryOptions = useMemo<ListPickerOption[]>(
    () =>
      PHONE_COUNTRIES.map((c) => ({
        id: c.iso,
        label: c.name,
        icon: <Text>{c.flag}</Text>,
        trailing: (
          <Pill intent="neutral" selected={c.iso === country.iso}>
            +{c.dialCode}
          </Pill>
        ),
        // Allow matching by name, ISO code, or dial code (e.g. "br" / "55").
        searchText: `${c.name} ${c.iso} ${c.dialCode}`,
      })),
    [country.iso],
  );

  const hasError = Boolean(error);

  return (
    <YStack gap={4}>
      <Label>{label}</Label>
      <XStack gap={8} alignItems="center">
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
          <XStack
            alignItems="center"
            gap={4}
            minHeight={44}
            paddingHorizontal={12}
            borderWidth={1}
            borderColor={hasError ? "$red8" : "$gray6"}
            borderRadius={8}
          >
            <Text>{country.flag}</Text>
            <Text>+{country.dialCode}</Text>
          </XStack>
        </Pressable>
        <Input
          flex={1}
          value={formatNational(country, national)}
          onChangeText={onChangeNational}
          keyboardType="phone-pad"
          placeholder={placeholder ?? "(11) 97883-3101"}
          {...(error !== undefined ? { error } : {})}
        />
      </XStack>
      {error ? (
        <Text preset="caption" color="$red10" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <ListPicker
        open={open}
        onOpenChange={setOpen}
        options={countryOptions}
        onPick={pickCountry}
        title="Selecione o país"
        searchable
        searchPlaceholder="Buscar país..."
        snapPoints={[70]}
      />
    </YStack>
  );
}
