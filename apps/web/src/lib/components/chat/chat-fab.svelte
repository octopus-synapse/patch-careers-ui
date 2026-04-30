<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { createAuthSession, createChatGetConversations, createChatGetUnreadCount } from 'api-client';
import { MessageCircle } from 'lucide-svelte';
import { Avatar } from 'ui';
import { browser } from '$app/environment';
import { chatState } from '$lib/state/chat-state.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

// Gate the FAB on the same 3-stage predicate used by navbar items: only
// surface messaging once the user has verified email AND completed
// onboarding. Chat queries below stay disabled until then so we don't
// hammer protected endpoints with 403s.
const session = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
const canUseApp = $derived(
  Boolean(session.data?.authenticated) &&
    !(session.data?.user?.needsEmailVerification ?? false) &&
    !(session.data?.user?.needsOnboarding ?? false),
);

const unreadQuery = createChatGetUnreadCount(() => ({
  query: { enabled: browser && canUseApp, refetchInterval: 30000 },
}));
const unread = $derived(unreadQuery.data?.count ?? 0);

const convQuery = createChatGetConversations(
  () => ({ limit: 3 }),
  () => ({ query: { enabled: browser && canUseApp, refetchInterval: 60000 } }),
);
const recents = $derived(
  (convQuery.data?.conversations?.conversations ?? []).slice(0, 3).map((c) => ({
    id: c.participant.id,
    name: c.participant.name,
    photoURL: c.participant.photoURL,
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
