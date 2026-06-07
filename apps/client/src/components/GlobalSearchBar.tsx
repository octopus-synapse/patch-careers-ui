/**
 * GlobalSearchBar — the header's center search, ported from the old web
 * navbar search.
 *
 * Queries `GET /v1/search/global` (resumes · users · jobs · posts, grouped)
 * with a short debounce, and drops a grouped results panel below the bar via
 * a Tamagui `Portal` so it floats over the screen content (the react-nav
 * header would otherwise clip it). Each result carries a web-style `href`;
 * tapping pushes it — the detail screens are still being built, so some
 * routes land on the Unmatched screen for now (forward-compatible).
 */

import { useGetV1SearchGlobal } from "@patch-careers/api-client";
import { editorialPalette } from "@patch-careers/tokens";
import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import { Portal } from "@tamagui/portal";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

export function GlobalSearchBar({ headerHeight }: { headerHeight: number }): ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);

  // Debounce the network term so we don't fire a request per keystroke; the
  // panel still opens immediately (showing a spinner) on the typed term.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [term]);

  // Close the floating panel when this screen blurs (the header — and its
  // Portal — stays mounted behind other tabs otherwise).
  useFocusEffect(
    useCallback(() => {
      return () => setFocused(false);
    }, []),
  );

  const enabled = debounced.length >= MIN_CHARS;
  const search = useGetV1SearchGlobal({ q: debounced }, { query: { enabled, staleTime: 10_000 } });
  const groups = (enabled ? (search.data?.groups ?? []) : []).filter((g) => g.items.length > 0);
  const hasResults = groups.length > 0;
  const open = focused && term.trim().length >= MIN_CHARS;

  function close(): void {
    setFocused(false);
    Keyboard.dismiss();
  }

  function go(href: string): void {
    setTerm("");
    setDebounced("");
    close();
    // Web-style href from the backend (e.g. /u/:username, /jobs/:id). Cast
    // past typed-routes; unknown routes hit Unmatched until their screen ships.
    router.push(href as Href);
  }

  return (
    <>
      <XStack
        alignItems="center"
        gap={7}
        height={38}
        paddingHorizontal={12}
        borderRadius={19}
        borderWidth={1}
        borderColor={focused ? editorialPalette.ink : editorialPalette.hairline}
        backgroundColor={editorialPalette.surface}
      >
        <Icon as={Search} size={15} color={editorialPalette.subtle} />
        <Input
          flex={1}
          value={term}
          onChangeText={setTerm}
          onFocus={() => setFocused(true)}
          placeholder="Buscar…"
          placeholderTextColor={editorialPalette.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          borderWidth={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          minHeight={36}
          fontSize={14}
          color={editorialPalette.ink}
        />
        {term.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            onPress={() => {
              setTerm("");
              setDebounced("");
            }}
            hitSlop={8}
          >
            <Icon as={X} size={15} color={editorialPalette.subtle} />
          </Pressable>
        ) : null}
      </XStack>

      {open ? (
        <Portal>
          {/* Outside-tap backdrop — starts below the header so the input stays tappable. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar busca"
            onPress={close}
            style={{
              position: "absolute",
              top: insets.top + headerHeight,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: insets.top + headerHeight + 6,
              left: 12,
              width: width - 24,
              maxHeight: 420,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: editorialPalette.hairline,
              backgroundColor: editorialPalette.surface,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            {search.isLoading ? (
              <XStack justifyContent="center" paddingVertical={28}>
                <ActivityIndicator color={editorialPalette.subtle} />
              </XStack>
            ) : !hasResults ? (
              <XStack justifyContent="center" paddingVertical={28}>
                <Text preset="caption" color={editorialPalette.subtle}>
                  Nenhum resultado para “{debounced}”
                </Text>
              </XStack>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                {groups.map((group) => (
                  <YStack key={group.type}>
                    <Text
                      preset="caption"
                      color={editorialPalette.subtle}
                      fontWeight="700"
                      paddingHorizontal={14}
                      paddingTop={12}
                      paddingBottom={4}
                    >
                      {group.label}
                    </Text>
                    {group.items.map((item) => (
                      <ResultRow
                        key={`${group.type}:${item.id}`}
                        title={item.title}
                        snippet={item.snippet}
                        badge={item.badge}
                        onPress={() => go(item.href)}
                      />
                    ))}
                  </YStack>
                ))}
              </ScrollView>
            )}
          </View>
        </Portal>
      ) : null}
    </>
  );
}

function ResultRow({
  title,
  snippet,
  badge,
  onPress,
}: {
  title: string;
  snippet?: string | undefined;
  badge?: string | undefined;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      {({ pressed }) => (
        <XStack
          alignItems="center"
          gap={10}
          paddingHorizontal={14}
          paddingVertical={10}
          backgroundColor={pressed ? editorialPalette.bg : "transparent"}
        >
          <YStack flex={1}>
            <Text preset="label" numberOfLines={1} color={editorialPalette.ink} fontWeight="600">
              {title}
            </Text>
            {snippet ? (
              <Text preset="caption" numberOfLines={1} color={editorialPalette.subtle}>
                {snippet}
              </Text>
            ) : null}
          </YStack>
          {badge ? (
            <Text preset="caption" fontSize={11} color={editorialPalette.accent} fontWeight="600">
              {badge}
            </Text>
          ) : null}
        </XStack>
      )}
    </Pressable>
  );
}
