/**
 * Conversation thread — the full-screen chat pushed over the tab bar.
 *
 * Accepts either an existing conversation `id` or, for a brand-new chat
 * started from people-search, `id="new"` plus a `recipientId` (the first send
 * creates the conversation and the hook adopts the returned id). Header /
 * avatar come in as route params so the screen paints instantly without a
 * round-trip.
 *
 * Keyboard avoidance uses `react-native-keyboard-controller`'s
 * `KeyboardAvoidingView` — it reads the keyboard frame natively each frame and
 * measures its own bounds, which is the only thing that stays correct under
 * Android edge-to-edge (where `adjustResize` and RN core's KeyboardAvoidingView
 * break). The outer view owns the safe-area insets, so the avoider's measured
 * bottom already sits above the gesture bar and the composer lands flush on the
 * keyboard with no double-counted inset.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Button, Text, YStack } from "@patch-careers/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Keyboard, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { MessageBubble } from "@/features/messages/components/MessageBubble";
import { MessageComposer } from "@/features/messages/components/MessageComposer";
import { buildRenderList } from "@/features/messages/helpers";
import { useConversationThread } from "@/features/messages/hooks";
import { useAuthState } from "@/providers/AuthProvider";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ConversationScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    recipientId?: string;
    name?: string;
    photo?: string;
    username?: string;
  }>();

  const { currentUser } = useAuthState();
  const currentUserId = currentUser?.userId ?? "";

  const rawId = firstParam(params.id);
  const isNew = rawId === "new";
  const recipientId = firstParam(params.recipientId) || null;
  const name = firstParam(params.name) || "Conversa";
  const photo = firstParam(params.photo) || undefined;
  const username = firstParam(params.username) || undefined;

  const thread = useConversationThread({
    initialConversationId: isNew ? null : rawId || null,
    recipientId,
  });

  const rendered = buildRenderList(thread.messages, currentUserId);

  const scrollRef = useRef<ScrollView>(null);
  const scrollToEnd = useCallback((animated: boolean): void => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated }));
  }, []);

  // Keep the latest message in view as the thread grows.
  useEffect(() => {
    if (rendered.length > 0) scrollToEnd(true);
  }, [rendered.length, scrollToEnd]);

  // ...and when the keyboard opens (the avoider shrinks the list).
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => scrollToEnd(true));
    return () => sub.remove();
  }, [scrollToEnd]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: editorialPalette.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ChatHeader name={name} username={username} photoURL={photo} onBack={() => router.back()} />

        <View style={{ flex: 1 }}>
          {thread.isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator color={editorialPalette.subtle} />
            </YStack>
          ) : thread.isError ? (
            <YStack flex={1} alignItems="center" justifyContent="center" gap={12} padding={24}>
              <Text preset="body" color={editorialPalette.muted} textAlign="center">
                Não foi possível carregar as mensagens.
              </Text>
              <Button intent="accent" variant="outlined" onPress={thread.refetch}>
                Tentar novamente
              </Button>
            </YStack>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "flex-end",
                paddingVertical: 12,
              }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollToEnd(false)}
            >
              {rendered.length === 0 ? (
                <YStack alignItems="center" paddingBottom={24}>
                  <Text preset="caption" color={editorialPalette.subtle}>
                    {isNew
                      ? `Diga olá para ${name}.`
                      : "Envie uma mensagem para começar a conversa."}
                  </Text>
                </YStack>
              ) : (
                rendered.map((item) => <MessageBubble key={item.message.id} item={item} />)
              )}
            </ScrollView>
          )}
        </View>

        <MessageComposer disabled={thread.sending} onSend={thread.send} />
      </KeyboardAvoidingView>
    </View>
  );
}
