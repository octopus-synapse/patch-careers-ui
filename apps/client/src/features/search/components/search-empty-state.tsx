/**
 * SearchEmptyState — what the modal shows before the term is searchable:
 * the persisted "Buscas recentes" (selected results, removable) and the
 * static "Explorar" navigation shortcuts, so the modal is useful even
 * before typing.
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { BriefcaseBusiness, MessageCircle, UserRound } from "lucide-react-native";
import type { ReactElement } from "react";
import { useRecentSearchesStore } from "../model/recent-searches.store";
import type { ExploreShortcut, RecentSearchItem } from "../types";
import { SearchResultRow } from "./search-result-row";
import { SearchSectionLabel } from "./search-section-label";

const EXPLORE_SHORTCUTS: ExploreShortcut[] = [
  { icon: BriefcaseBusiness, label: "Ver vagas", href: "/(tabs)/jobs" },
  { icon: MessageCircle, label: "Mensagens", href: "/messages" },
  { icon: UserRound, label: "Meu perfil", href: "/(tabs)/profile" },
];

export function SearchEmptyState({
  onSelectRecent,
  onSelectShortcut,
}: {
  onSelectRecent: (item: RecentSearchItem) => void;
  onSelectShortcut: (shortcut: ExploreShortcut) => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const recents = useRecentSearchesStore((s) => s.items);
  const removeRecent = useRecentSearchesStore((s) => s.remove);

  return (
    <YStack>
      <SearchSectionLabel>Buscas recentes</SearchSectionLabel>
      {recents.length === 0 ? (
        <XStack justifyContent="center" paddingVertical={28}>
          <Text preset="caption" color={editorialPalette.subtle}>
            Nenhuma busca recente
          </Text>
        </XStack>
      ) : (
        recents.map((item) => (
          <SearchResultRow
            key={item.href}
            title={item.title}
            snippet={item.snippet}
            badge={item.badge}
            onPress={() => onSelectRecent(item)}
            onRemove={() => removeRecent(item.href)}
          />
        ))
      )}

      <SearchSectionLabel>Explorar</SearchSectionLabel>
      {EXPLORE_SHORTCUTS.map((shortcut) => (
        <SearchResultRow
          key={shortcut.href}
          title={shortcut.label}
          icon={shortcut.icon}
          onPress={() => onSelectShortcut(shortcut)}
        />
      ))}
    </YStack>
  );
}
