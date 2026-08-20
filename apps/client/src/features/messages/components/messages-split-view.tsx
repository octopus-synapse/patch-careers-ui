/**
 * Desktop-web Messages — the classic two-pane messenger, framed as a single
 * hairline card that fills the content column: inbox + people-search on the
 * left (fixed rail), the live thread inline on the right. Selecting a row
 * swaps the right pane in place (no route push — that full-screen navigation
 * is the mobile idiom); with nothing selected the pane holds a calm editorial
 * empty state, and the first conversation auto-selects so the screen never
 * opens onto a void.
 *
 * New chats from search reuse the same lookup as mobile: an existing
 * conversation opens directly, otherwise the pane mounts in "new" mode and
 * the first send creates it. Rows highlight by conversation id *or* by
 * participant, so a just-created thread stays lit once the inbox catches up.
 */

import { Avatar, Divider, EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search as SearchIcon } from "lucide-react-native";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView } from "react-native";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  lookupConversationWithUser,
  useConversationThread,
  useInbox,
  useUserSearch,
} from "../hooks/queries";
import { buildRenderList, participantLabel } from "../lib/helpers";
import type { ChatUser, Conversation } from "../types";
import { ConversationListSkeleton } from "./conversation-list-skeleton";
import { ConversationRow } from "./conversation-row";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { UserResultRow } from "./user-result-row";
import { UserSearchField } from "./user-search-field";

/** What the right pane is showing: an existing thread or a not-yet-created one. */
type ThreadSelection = {
  /** Conversation id, or "new" for a thread created on first send. */
  id: string;
  recipientId?: string;
  name: string;
  photo?: string;
  username?: string;
};

const INBOX_RAIL_WIDTH = 320;

function selectionFromConversation(conversation: Conversation, name: string): ThreadSelection {
  return {
    id: conversation.id,
    recipientId: conversation.participant.id,
    name,
    ...(conversation.participant.photoURL ? { photo: conversation.participant.photoURL } : {}),
    ...(conversation.participant.username ? { username: conversation.participant.username } : {}),
  };
}

export function MessagesSplitView(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const inbox = useInbox();
  const [term, setTerm] = useState("");
  const search = useUserSearch(term);
  const searching = term.trim().length >= 2;
  const now = Date.now();
  const [selection, setSelection] = useState<ThreadSelection | null>(null);

  // Never open onto a void: the freshest conversation self-selects.
  useEffect(() => {
    if (selection === null && inbox.conversations.length > 0) {
      const first = inbox.conversations[0];
      if (first)
        setSelection(selectionFromConversation(first, participantLabel(first.participant, t)));
    }
  }, [selection, inbox.conversations, t]);

  function openConversation(conversation: Conversation): void {
    setSelection(
      selectionFromConversation(conversation, participantLabel(conversation.participant, t)),
    );
  }

  async function openUser(user: ChatUser): Promise<void> {
    const name = participantLabel(user, t);
    let existing: string | null = null;
    try {
      existing = await lookupConversationWithUser(queryClient, user.id);
    } catch {
      existing = null;
    }
    setTerm("");
    setSelection({
      id: existing ?? "new",
      recipientId: user.id,
      name,
      ...(user.photoURL ? { photo: user.photoURL } : {}),
      ...(user.username ? { username: user.username } : {}),
    });
  }

  const isSelected = useCallback(
    (conversation: Conversation): boolean => {
      if (selection === null) return false;
      if (conversation.id === selection.id) return true;
      // A thread created this session still shows as "new"; match by person.
      return (
        selection.recipientId !== undefined && conversation.participant.id === selection.recipientId
      );
    },
    [selection],
  );

  return (
    <XStack
      flex={1}
      marginVertical={24}
      borderWidth={1}
      borderColor={editorialPalette.hairline}
      borderRadius={18}
      overflow="hidden"
      backgroundColor={editorialPalette.surface}
    >
      {/* Inbox rail */}
      <YStack width={INBOX_RAIL_WIDTH} backgroundColor={editorialPalette.surface}>
        <YStack paddingTop={22} paddingBottom={6}>
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={24}
            lineHeight={32}
            letterSpacing={-0.4}
            color={editorialPalette.ink}
            paddingHorizontal={20}
            paddingBottom={14}
          >
            {t("messages.title")}
          </Text>
          <UserSearchField value={term} onChangeText={setTerm} onClear={() => setTerm("")} />
        </YStack>

        {searching ? (
          <RailSearchResults
            results={search.results}
            isLoading={search.isLoading}
            onSelect={(u) => void openUser(u)}
          />
        ) : inbox.isLoading ? (
          <ConversationListSkeleton />
        ) : inbox.isError ? (
          <YStack flex={1} justifyContent="center">
            <EmptyState
              icon={<Icon as={SearchIcon} size={28} color={editorialPalette.subtle} />}
              title={t("messages.inbox.errorTitle")}
              description={t("messages.inbox.errorDescription")}
              ctaLabel={t("common.retry")}
              onCta={inbox.refetch}
            />
          </YStack>
        ) : inbox.conversations.length === 0 ? (
          <YStack flex={1} justifyContent="center">
            <EmptyState
              icon={<Icon as={MessageCircle} size={28} color={editorialPalette.subtle} />}
              title={t("messages.inbox.emptyTitle")}
              description={t("messages.inbox.emptyDescription")}
            />
          </YStack>
        ) : (
          <FlatList<Conversation>
            data={inbox.conversations}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <ConversationRow
                conversation={item}
                now={now}
                onPress={openConversation}
                selected={isSelected(item)}
              />
            )}
            ItemSeparatorComponent={RailRowSeparator}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </YStack>

      <YStack width={1} backgroundColor={editorialPalette.hairline} />

      {/* Thread pane */}
      <YStack flex={1} backgroundColor={editorialPalette.bg}>
        {selection ? (
          // Remount per person so the thread hook re-arms cleanly.
          <ThreadPane key={selection.recipientId ?? selection.id} selection={selection} />
        ) : (
          <ThreadEmptyState />
        )}
      </YStack>
    </XStack>
  );
}

function RailRowSeparator(): ReactElement {
  const editorialPalette = useEditorialPalette();
  return <Divider color={editorialPalette.hairline} marginLeft={64} />;
}

function RailSearchResults({
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

function ThreadEmptyState(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap={14} padding={32}>
      <YStack
        width={64}
        height={64}
        borderRadius={32}
        borderWidth={1}
        borderColor={editorialPalette.hairline}
        alignItems="center"
        justifyContent="center"
        backgroundColor={editorialPalette.surface}
      >
        <Icon as={MessageCircle} size={26} color={editorialPalette.subtle} />
      </YStack>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={22}
        lineHeight={30}
        color={editorialPalette.ink}
        textAlign="center"
      >
        {t("messages.desktop.emptyTitle")}
      </Text>
      <Text preset="caption" color={editorialPalette.muted} textAlign="center" maxWidth={340}>
        {t("messages.desktop.emptyDescription")}
      </Text>
    </YStack>
  );
}

function ThreadPane({ selection }: { selection: ThreadSelection }): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  const { currentUser } = useAuthState();
  const currentUserId = currentUser?.userId ?? "";
  const isNew = selection.id === "new";

  const thread = useConversationThread({
    initialConversationId: isNew ? null : selection.id,
    recipientId: selection.recipientId ?? null,
  });

  const rendered = buildRenderList(thread.messages, currentUserId);

  const scrollRef = useRef<ScrollView>(null);
  const scrollToEnd = useCallback((animated: boolean): void => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated }));
  }, []);

  useEffect(() => {
    if (rendered.length > 0) scrollToEnd(true);
  }, [rendered.length, scrollToEnd]);

  return (
    <YStack flex={1}>
      {/* Participant header — no back affordance on desktop; the rail is the nav. */}
      <XStack
        alignItems="center"
        gap={12}
        paddingHorizontal={20}
        paddingVertical={12}
        borderBottomWidth={1}
        borderBottomColor={editorialPalette.hairline}
        backgroundColor={editorialPalette.surface}
      >
        <Avatar src={selection.photo} name={selection.name} size="sm" />
        <YStack flex={1}>
          <Text preset="label" numberOfLines={1} color={editorialPalette.ink} fontWeight="600">
            {selection.name}
          </Text>
          {selection.username ? (
            <Text preset="caption" fontSize={11} color={editorialPalette.subtle}>
              @{selection.username}
            </Text>
          ) : null}
        </YStack>
      </XStack>

      {thread.isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={editorialPalette.subtle} />
        </YStack>
      ) : thread.isError ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} padding={24}>
          <Text preset="body" color={editorialPalette.muted} textAlign="center">
            {t("messages.thread.loadError")}
          </Text>
          <Text preset="caption" color={editorialPalette.accent} onPress={thread.refetch}>
            {t("common.retry")}
          </Text>
        </YStack>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToEnd(false)}
        >
          {rendered.length === 0 ? (
            <YStack alignItems="center" paddingBottom={28}>
              <Text preset="caption" color={editorialPalette.subtle}>
                {isNew
                  ? t("messages.thread.sayHello", { name: selection.name })
                  : t("messages.thread.emptyHint")}
              </Text>
            </YStack>
          ) : (
            rendered.map((item) => <MessageBubble key={item.message.id} item={item} />)
          )}
        </ScrollView>
      )}

      <MessageComposer disabled={thread.sending} onSend={thread.send} />
    </YStack>
  );
}
