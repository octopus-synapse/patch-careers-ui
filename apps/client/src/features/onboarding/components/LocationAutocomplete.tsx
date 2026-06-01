/**
 * `<LocationAutocomplete>` — single input that resolves País/Estado/Cidade
 * via the geo endpoint and stores the chosen `label` as the free-form
 * location string. Selecting a suggestion also surfaces its `countryCode`
 * so the caller can default the phone country.
 */

import { useGetV1GeoLocations } from "@patch-careers/api-client";
import { Card, Input, Label, Text, XStack, YStack } from "@patch-careers/ui";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView } from "react-native";

export interface LocationMeta {
  countryCode?: string;
}

export interface LocationAutocompleteProps {
  label: string;
  value: string;
  onChange: (label: string, meta?: LocationMeta) => void;
  placeholder?: string;
  error?: string | undefined;
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;

export function LocationAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  error,
}: LocationAutocompleteProps) {
  const [text, setText] = useState(value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const lastEmitted = useRef(value);

  // External value change (draft load) re-syncs the field.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setText(value);
  }, [value]);

  // Debounce the typed text into the query that hits the endpoint.
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  const enabled = open && query.length >= MIN_QUERY;
  const { data, isFetching } = useGetV1GeoLocations(
    { q: query, limit: 10 },
    { query: { enabled } },
  );
  const items = data?.items ?? [];

  const handleChangeText = (next: string) => {
    setText(next);
    setOpen(true);
    lastEmitted.current = next;
    onChange(next);
  };

  const handleSelect = (label: string, countryCode: string) => {
    setText(label);
    setOpen(false);
    lastEmitted.current = label;
    onChange(label, { countryCode });
  };

  return (
    <YStack gap={4}>
      <Label>{label}</Label>
      <Input
        value={text}
        onChangeText={handleChangeText}
        placeholder={placeholder ?? "Cidade, estado ou país"}
        autoCorrect={false}
        {...(error !== undefined ? { error } : {})}
      />
      {error ? (
        <Text preset="caption" color="$red10" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {enabled && (items.length > 0 || isFetching) ? (
        <Card padding={4}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
            <YStack gap={2}>
              {isFetching && items.length === 0 ? (
                <Text preset="caption" color="$gray10" padding={8}>
                  Buscando...
                </Text>
              ) : null}
              {items.map((item) => (
                <Pressable
                  key={`${item.label}-${item.countryCode}-${item.stateCode ?? ""}`}
                  onPress={() => handleSelect(item.label, item.countryCode)}
                  accessibilityRole="button"
                >
                  <XStack paddingVertical={10} paddingHorizontal={8} borderRadius={8}>
                    <Text flex={1}>{item.label}</Text>
                  </XStack>
                </Pressable>
              ))}
            </YStack>
          </ScrollView>
        </Card>
      ) : null}
    </YStack>
  );
}
