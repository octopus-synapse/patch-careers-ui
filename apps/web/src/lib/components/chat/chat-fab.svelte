<script lang="ts">
import { createChatConversationsGet, createChatUnread } from 'api-client';
import { MessageCircle } from 'lucide-svelte';
import { Avatar } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import { chatState } from '$lib/state/chat-state.svelte';
import { locale } from '$lib/state/locale.svelte';

/**
 * Floating chat trigger surfaced on every authenticated page. Stays gated on
 * the same predicate as the navbar (verified email AND completed onboarding)
 * so we never hammer protected endpoints with 403s.
 *
 * Backend ships `void` schemas for the chat endpoints (T11/orval pending), so
 * we cast to local interfaces at the boundary — these match the documented
 * response shapes for `GET /api/v1/chat/unread` and
 * `GET /api/v1/chat/conversations`.
 */
type UnreadResponse = { count?: number };

type ConversationParticipant = {
  id: string;
  name: string | null;
  photoURL: string | null;
};

type ConversationItem = {
  id: string;
  participant: ConversationParticipant;
};

type ConversationsResponse = {
  items?: ConversationItem[];
  conversations?: { conversations?: ConversationItem[] } | ConversationItem[];
};

const t = $derived(locale.t);

const session = useAuth();
const canUseApp = $derived(
  Boolean(session.data?.authenticated) &&
    !(session.data?.user?.needsEmailVerification ?? false) &&
    !(session.data?.user?.needsOnboarding ?? false),
);

const unreadQuery = createChatUnread(() => ({
  query: { enabled: browser && canUseApp, refetchInterval: 30_000 },
}));
const unread = $derived((unreadQuery.data as unknown as UnreadResponse | undefined)?.count ?? 0);

const convQuery = createChatConversationsGet(
  () => ({ limit: 3 }),
  () => ({ query: { enabled: browser && canUseApp, refetchInterval: 60_000 } }),
);

function extractConversations(data: ConversationsResponse | undefined): ConversationItem[] {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  const inner = data.conversations;
  if (Array.isArray(inner)) return inner;
  if (inner && Array.isArray(inner.conversations)) return inner.conversations;
  return [];
}

const recents = $derived(
  extractConversations(convQuery.data as unknown as ConversationsResponse | undefined)
    .slice(0, 3)
    .map((c) => ({
      id: c.participant?.id ?? '',
      name: c.participant?.name ?? null,
      photoURL: c.participant?.photoURL ?? null,
    })),
);

function openChat() {
  chatState.open();
}
</script>

{#if canUseApp && !chatState.isOpen}
	<div class="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
		<button
			type="button"
			onclick={openChat}
			aria-label={t('nav.messages')}
			class="group inline-flex items-center gap-2.5 rounded-full bg-neutral-800 py-2 pl-3 pr-2 text-sm font-semibold text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all hover:bg-neutral-700 hover:shadow-xl dark:bg-neutral-800 dark:hover:bg-neutral-700"
		>
			<span class="relative flex h-6 w-6 items-center justify-center">
				<MessageCircle size={18} class="text-white" />
				{#if unread > 0}
					<span class="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-neutral-800">
						{unread > 99 ? '99+' : unread}
					</span>
				{/if}
			</span>
			<span class="pr-0.5">{t('nav.messages')}</span>
			{#if recents.length > 0}
				<div class="flex items-center -space-x-2 pl-1">
					{#each recents as recent (recent.id)}
						<span class="rounded-full ring-2 ring-neutral-800">
							<Avatar name={recent.name ?? '?'} photoURL={recent.photoURL} size="sm" />
						</span>
					{/each}
				</div>
				<span
					aria-hidden="true"
					class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-[11px] font-bold text-neutral-300 transition-colors group-hover:bg-neutral-600"
				>
					···
				</span>
			{/if}
		</button>
	</div>
{/if}
