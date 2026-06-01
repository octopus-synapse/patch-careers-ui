/**
 * `<PhoneInput>` — country selector + live-masked national number.
 *
 * The user picks a country (dial code) from a searchable sheet, then types
 * the number; the field renders the pretty national mask (e.g.
 * `(11) 97883-3101`) while the component emits the canonical
 * `+<dial><national>` string the backend stores.
 */

import { Input, Label, Pill, Sheet, Text, XStack, YStack } from "@patch-careers/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import {
  DEFAULT_PHONE_COUNTRY,
  findCountryByIso,
  formatNational,
  onlyDigits,
  PHONE_COUNTRIES,
  type PhoneCountry,
  parseCanonicalPhone,
  toCanonicalPhone,
} from "../phone/phoneMask";

export interface PhoneInputProps {
  label: string;
  /** Canonical `+<dial><national>` value (server shape). */
  value: string;
  onChange: (canonical: string) => void;
  /** ISO code to default the country to (e.g. from the location step). */
  defaultCountryIso?: string;
  placeholder?: string;
  error?: string | undefined;
}

export function PhoneInput({
  label,
  value,
  onChange,
  defaultCountryIso,
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
  const [search, setSearch] = useState("");

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

  const pickCountry = (c: PhoneCountry) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    emit(c, national);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q),
    );
  }, [search]);

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

      <Sheet open={open} onOpenChange={setOpen} snapPoints={[70]}>
        <YStack gap={8} flex={1}>
          <Text preset="h3">Selecione o país</Text>
          <Input value={search} onChangeText={setSearch} placeholder="Buscar país..." />
          <ScrollView keyboardShouldPersistTaps="handled">
            <YStack gap={2}>
              {filtered.map((c) => (
                <Pressable key={c.iso} onPress={() => pickCountry(c)} accessibilityRole="button">
                  <XStack
                    alignItems="center"
                    gap={8}
                    paddingVertical={10}
                    paddingHorizontal={8}
                    borderRadius={8}
                  >
                    <Text>{c.flag}</Text>
                    <Text flex={1}>{c.name}</Text>
                    <Pill intent="neutral" selected={c.iso === country.iso}>
                      +{c.dialCode}
                    </Pill>
                  </XStack>
                </Pressable>
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      </Sheet>
    </YStack>
  );
}
