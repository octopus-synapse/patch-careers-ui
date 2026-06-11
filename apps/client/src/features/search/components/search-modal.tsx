/**
 * SearchModal — the command-palette global search (DocSearch style): a
 * floating card anchored near the top of the screen over a soft scrim,
 * opened from the header's SearchTrigger. Owns the real input (autofocused),
 * the grouped `GET /v1/search/global` results, and — while the term is
 * short — the persisted recents + Explorar shortcuts.
 *
 * Top-anchored on purpose: the card visually "grows" out of the header
 * trigger, and the keyboard never collides with it. The card's max height
 * tracks the keyboard via Keyboard events — `KeyboardAvoidingView` can't be
 * trusted here because Android Modals with `statusBarTranslucent` ignore
 * `adjustResize`. Chrome follows <ConfirmDialog>: transparent RN Modal +
 * Animated card (fade/scale, entering from above). Dismiss: outside tap,
 * ✕, Android back, and Escape on web (mirrored by the "esc" hint chip).
 */

import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import { type Href, useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextInput,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SEARCH_MIN_CHARS, useGlobalSearch } from "../hooks/use-global-search";
import { useRecentSearchesStore } from "../model/recent-searches.store";
import type { ExploreShortcut, RecentSearchItem, SearchGroup } from "../types";
import { SearchEmptyState } from "./search-empty-state";
import { SearchResultRow } from "./search-result-row";
import { SearchSectionLabel } from "./search-section-label";

const SCRIM = { light: "rgba(10,10,10,0.32)", dark: "rgba(0,0,0,0.55)" } as const;
const USE_NATIVE_DRIVER = Platform.OS !== "web";
// Gap between the safe area and the card, and between card and keyboard.
const TOP_GAP = 10;
const BOTTOM_GAP = 16;

/**
 * Live keyboard height so the card can cap its own height. `will*` events
 * (iOS only) keep the resize in step with the keyboard animation.
 */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  const router = useRouter();
  const inputRef = useRef<TextInput | null>(null);
  const [term, setTerm] = useState("");
  const { groups, isLoading, enabled, debounced } = useGlobalSearch(term);
  const addRecent = useRecentSearchesStore((s) => s.add);

  const topOffset = insets.top + TOP_GAP;
  const cardWidth = Math.min(560, screenW - 32);
  // Never extend under the keyboard; otherwise cap like a palette, not a sheet.
  const cardMaxHeight = Math.min(520, screenH - topOffset - keyboardHeight - BOTTOM_GAP);

  // `anim`: 0 = hidden, 1 = shown. `visible` keeps the Modal mounted through
  // the exit animation before unmounting (mirrors <ConfirmDialog>). Exit is
  // intentionally shorter than enter so dismissal feels immediate.
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [open, anim]);

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
  // Enter from above — the card spatially "drops out of" the header trigger.
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
      // Focus after the modal is actually on screen — `autoFocus` fires too
      // early inside RN Modals (notably Android) and the keyboard never opens.
      onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}
    >
      {/* Soft scrim — tap anywhere outside the card to dismiss. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM[themeName], opacity: anim }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar busca"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.card,
          {
            alignSelf: "center",
            marginTop: topOffset,
            width: cardWidth,
            maxHeight: cardMaxHeight,
            backgroundColor: editorialPalette.surface,
            borderColor: editorialPalette.hairline,
            opacity: anim,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {/* Top row — the real search input, over a hairline rule. */}
        <XStack
          alignItems="center"
          gap={7}
          paddingHorizontal={16}
          paddingVertical={12}
          borderBottomWidth={1}
          borderBottomColor={editorialPalette.hairline}
        >
          <Icon as={Search} size={16} color={editorialPalette.subtle} />
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
            fontSize={15}
            color={editorialPalette.ink}
          />
          {term.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              onPress={() => setTerm("")}
              hitSlop={8}
            >
              <Icon as={X} size={16} color={editorialPalette.subtle} />
            </Pressable>
          ) : null}
          {Platform.OS === "web" ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar busca" onPress={close}>
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
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar busca"
              onPress={close}
              hitSlop={8}
            >
              <Icon as={X} size={18} color={editorialPalette.muted} />
            </Pressable>
          )}
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
          <YStack alignItems="center" gap={4} paddingVertical={32} paddingHorizontal={24}>
            <Text preset="caption" color={editorialPalette.subtle} textAlign="center">
              Nenhum resultado para “{debounced}”
            </Text>
            <Text preset="caption" color={editorialPalette.subtle} textAlign="center">
              Tente outro termo — cargos, pessoas ou empresas.
            </Text>
          </YStack>
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
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
});
