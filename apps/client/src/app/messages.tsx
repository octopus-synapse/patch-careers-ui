/**
 * Messages — a standalone screen, NOT a bottom-tab item.
 *
 * Reached from the AppHeader's messages icon via `router.push("/messages")`,
 * it sits at the root Stack level (sibling to `(tabs)`) so it slides in over
 * the tabs with no bottom tab bar and no global AppHeader — its own slim back
 * bar owns the exit. The inbox itself is the conversation list plus a
 * people-search to start new threads; tapping a row pushes the full-screen
 * thread (`conversation/[id]`). Editorial Calm DS, composed from
 * `@patch-careers/ui`.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, MessageCircle, Search as SearchIcon } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChatUser, Conversation } from "@/features/messages";
import {
  ConversationListSkeleton,
  ConversationRow,
  lookupConversationWithUser,
  participantLabel,
  UserResultRow,
  UserSearchField,
  useInbox,
  useUserSearch,
} from "@/features/messages";

function RowSeparator(): ReactElement {
  return (
    <View
      style={{
        height: 1,
        marginLeft: 64,
        backgroundColor: editorialPalette.hairline,
      }}
    />
  );
}

export default function MessagesScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const inbox = useInbox();
  const [term, setTerm] = useState("");
  const search = useUserSearch(term);
  const searching = term.trim().length >= 2;
  const now = Date.now();

  // Standalone screen, so it owns its exit. Fall back to the home tab when
  // there's no back stack (e.g. opened via a cold deep link).
  function goBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  }

  function goToThread(params: { id: string } & Record<string, string>): void {
    router.push({ pathname: "/conversation/[id]", params });
  }

  function openConversation(conversation: Conversation): void {
    goToThread({
      id: conversation.id,
      name: participantLabel(conversation.participant),
      photo: conversation.participant.photoURL ?? "",
      username: conversation.participant.username ?? "",
    });
  }

  async function openUser(user: ChatUser): Promise<void> {
    const name = participantLabel(user);
    const base = { name, photo: user.photoURL ?? "", username: user.username ?? "" };
    let existing: string | null = null;
    try {
      existing = await lookupConversationWithUser(queryClient, user.id);
    } catch {
      existing = null;
    }
    setTerm("");
    goToThread(existing ? { id: existing, ...base } : { id: "new", recipientId: user.id, ...base });
  }

  return (
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg, paddingTop: insets.top }}>
      {/* Slim back bar — this screen has no global AppHeader. */}
      <XStack alignItems="center" height={44} paddingHorizontal={8}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={goBack}
          hitSlop={8}
          style={{ padding: 6 }}
        >
          <Icon as={ChevronLeft} size={26} color={editorialPalette.ink} />
        </Pressable>
      </XStack>

      <YStack paddingHorizontal={20} paddingTop={4} paddingBottom={10}>
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={30}
          lineHeight={36}
          letterSpacing={-0.6}
          fontWeight="400"
          color={editorialPalette.ink}
        >
          Mensagens
        </Text>
      </YStack>

      <UserSearchField value={term} onChangeText={setTerm} onClear={() => setTerm("")} />

      {searching ? (
        <SearchResults
          results={search.results}
          isLoading={search.isLoading}
          onSelect={(u) => void openUser(u)}
        />
      ) : inbox.isLoading ? (
        <ConversationListSkeleton />
      ) : inbox.isError ? (
        <InboxError onRetry={inbox.refetch} />
      ) : inbox.conversations.length === 0 ? (
        <EmptyInbox />
      ) : (
        <FlatList<Conversation>
          data={inbox.conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow conversation={item} now={now} onPress={openConversation} />
          )}
          ItemSeparatorComponent={RowSeparator}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

function SearchResults({
  results,
  isLoading,
  onSelect,
}: {
  results: ChatUser[];
  isLoading: boolean;
  onSelect: (user: ChatUser) => void;
}): ReactElement {
  if (isLoading) {
    return (
      <XStack justifyContent="center" paddingVertical={28}>
        <ActivityIndicator color={editorialPalette.subtle} />
      </XStack>
    );
  }
  if (results.length === 0) {
    return (
      <XStack justifyContent="center" paddingVertical={28}>
        <Text preset="caption" color={editorialPalette.subtle}>
          Nenhuma pessoa encontrada
        </Text>
      </XStack>
    );
  }
  return (
    <FlatList<ChatUser>
      data={results}
      keyExtractor={(u) => u.id}
      renderItem={({ item }) => <UserResultRow user={item} onPress={onSelect} />}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function EmptyInbox(): ReactElement {
  return (
    <YStack flex={1} justifyContent="center">
      <EmptyState
        icon={<Icon as={MessageCircle} size={32} color={editorialPalette.subtle} />}
        title="Nenhuma conversa ainda"
        description="Busque uma pessoa acima para iniciar uma conversa."
      />
    </YStack>
  );
}

function InboxError({ onRetry }: { onRetry: () => void }): ReactElement {
  return (
    <YStack flex={1} justifyContent="center">
      <EmptyState
        icon={<Icon as={SearchIcon} size={32} color={editorialPalette.subtle} />}
        title="Não foi possível carregar suas conversas"
        description="Verifique sua conexão e tente novamente."
        ctaLabel="Tentar novamente"
        onCta={onRetry}
      />
    </YStack>
  );
}
