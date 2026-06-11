/**
 * SearchModal — the fullscreen, DocSearch-style global search. Opened from
 * the header's SearchTrigger; owns the real input (autofocused), the grouped
 * `GET /v1/search/global` results, and — while the term is short — the
 * persisted recents + Explorar shortcuts.
 *
 * Fullscreen RN Modal on every platform (precedent: CvModal): Android back
 * closes via `onRequestClose`, web adds an Escape listener + "esc" hint chip.
 */

import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import { type Href, useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  type TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SEARCH_MIN_CHARS, useGlobalSearch } from "../hooks/use-global-search";
import { useRecentSearchesStore } from "../model/recent-searches.store";
import type { ExploreShortcut, RecentSearchItem, SearchGroup } from "../types";
import { SearchEmptyState } from "./search-empty-state";
import { SearchResultRow } from "./search-result-row";
import { SearchSectionLabel } from "./search-section-label";

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput | null>(null);
  const [term, setTerm] = useState("");
  const { groups, isLoading, enabled, debounced } = useGlobalSearch(term);
  const addRecent = useRecentSearchesStore((s) => s.add);

  function close(): void {
    setTerm("");
    onClose();
  }

  // Web: Escape dismisses, mirroring the "esc" hint chip by the input.
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setTerm("");
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function go(href: string): void {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    close();
    // Web-style href from the backend (e.g. /u/:username, /jobs/:id). Cast
    // past typed-routes; unknown routes hit Unmatched until their screen ships.
    router.push(href as Href);
  }

  function selectResult(group: SearchGroup, item: SearchGroup["items"][number]): void {
    addRecent({
      id: item.id,
      title: item.title,
      snippet: item.snippet,
      badge: item.badge,
      href: item.href,
      type: group.type,
    });
    go(item.href);
  }

  function selectRecent(item: RecentSearchItem): void {
    addRecent(item); // bump back to the top of the list
    go(item.href);
  }

  function selectShortcut(shortcut: ExploreShortcut): void {
    go(shortcut.href);
  }

  const showEmptyState = term.trim().length < SEARCH_MIN_CHARS;

  return (
    <Modal
      visible={open}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
      // Focus after the modal is actually on screen — `autoFocus` fires too
      // early inside RN Modals (notably Android) and the keyboard never opens.
      onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}
    >
      <View
        accessibilityViewIsModal
        style={{ flex: 1, paddingTop: insets.top, backgroundColor: editorialPalette.bg }}
      >
        {/* Top row — the real search input + close, over a hairline rule. */}
        <XStack
          alignItems="center"
          gap={10}
          paddingHorizontal={16}
          paddingVertical={10}
          borderBottomWidth={1}
          borderBottomColor={editorialPalette.hairline}
        >
          <XStack
            flex={1}
            alignItems="center"
            gap={7}
            height={38}
            paddingHorizontal={12}
            borderRadius={19}
            borderWidth={1}
            borderColor={editorialPalette.ink}
            backgroundColor={editorialPalette.surface}
          >
            <Icon as={Search} size={15} color={editorialPalette.subtle} />
            <Input
              ref={inputRef}
              flex={1}
              value={term}
              onChangeText={setTerm}
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
                onPress={() => setTerm("")}
                hitSlop={8}
              >
                <Icon as={X} size={15} color={editorialPalette.subtle} />
              </Pressable>
            ) : null}
            {Platform.OS === "web" ? (
              <Text
                fontFamily={editorialFonts.mono}
                fontSize={11}
                color={editorialPalette.subtle}
                paddingHorizontal={6}
                paddingVertical={2}
                borderWidth={1}
                borderColor={editorialPalette.hairline}
                borderRadius={6}
              >
                esc
              </Text>
            ) : null}
          </XStack>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar busca"
            onPress={close}
            hitSlop={12}
          >
            <Icon as={X} size={22} color={editorialPalette.muted} />
          </Pressable>
        </XStack>

        {/* Body — recents/Explorar before the term is searchable, then the
            live grouped results (spinner / no-results / groups). */}
        {showEmptyState ? (
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <SearchEmptyState onSelectRecent={selectRecent} onSelectShortcut={selectShortcut} />
          </ScrollView>
        ) : isLoading || (!enabled && groups.length === 0) ? (
          <XStack justifyContent="center" paddingVertical={32}>
            <ActivityIndicator color={editorialPalette.subtle} />
          </XStack>
        ) : groups.length === 0 ? (
          <XStack justifyContent="center" paddingVertical={32}>
            <Text preset="caption" color={editorialPalette.subtle}>
              Nenhum resultado para “{debounced}”
            </Text>
          </XStack>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {groups.map((group) => (
              <YStack key={group.type}>
                <SearchSectionLabel>{group.label}</SearchSectionLabel>
                {group.items.map((item) => (
                  <SearchResultRow
                    key={`${group.type}:${item.id}`}
                    title={item.title}
                    snippet={item.snippet}
                    badge={item.badge}
                    onPress={() => selectResult(group, item)}
                  />
                ))}
              </YStack>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
