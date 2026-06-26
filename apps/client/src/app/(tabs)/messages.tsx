/**
 * Messages — a bottom-tab screen (Vagas · Mensagens · Notificações · Perfil).
 *
 * The inbox is the conversation list plus a people-search to start new threads;
 * tapping a row pushes the full-screen thread (`conversation/[id]`). It sits
 * under the global AppHeader like the other tabs (no own back bar). Editorial
 * Calm DS, composed from `@patch-careers/ui`.
 */

import { EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { MessageCircle, Search as SearchIcon } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
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
import { useI18n } from "@/providers/i18n-provider";

function RowSeparator(): ReactElement {
  const editorialPalette = useEditorialPalette();
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
  const editorialPalette = useEditorialPalette();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const inbox = useInbox();
  const [term, setTerm] = useState("");
  const search = useUserSearch(term);
  const searching = term.trim().length >= 2;
  const now = Date.now();

  function goToThread(params: { id: string } & Record<string, string>): void {
    router.push({ pathname: "/conversation/[id]", params });
  }

  function openConversation(conversation: Conversation): void {
    goToThread({
      id: conversation.id,
      name: participantLabel(conversation.participant, t),
      photo: conversation.participant.photoURL ?? "",
      username: conversation.participant.username ?? "",
    });
  }

  async function openUser(user: ChatUser): Promise<void> {
    const name = participantLabel(user, t);
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
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg }}>
      <YStack paddingHorizontal={20} paddingTop={16} paddingBottom={24}>
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={30}
          lineHeight={40}
          letterSpacing={-0.6}
          fontWeight="400"
          color={editorialPalette.ink}
          textAlign="center"
        >
          {t("messages.title")}
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
          contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
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
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
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
          {t("messages.search.noResults")}
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
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <YStack flex={1} justifyContent="center">
      <EmptyState
        icon={<Icon as={MessageCircle} size={32} color={editorialPalette.subtle} />}
        title={t("messages.inbox.emptyTitle")}
        description={t("messages.inbox.emptyDescription")}
      />
    </YStack>
  );
}

function InboxError({ onRetry }: { onRetry: () => void }): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <YStack flex={1} justifyContent="center">
      <EmptyState
        icon={<Icon as={SearchIcon} size={32} color={editorialPalette.subtle} />}
        title={t("messages.inbox.errorTitle")}
        description={t("messages.inbox.errorDescription")}
        ctaLabel={t("common.retry")}
        onCta={onRetry}
      />
    </YStack>
  );
}
