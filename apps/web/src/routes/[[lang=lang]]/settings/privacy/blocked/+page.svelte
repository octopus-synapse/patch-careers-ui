<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createChatBlockUsersGetBlockedUsers,
  createChatBlockUsersUnblockUser,
  getChatBlockUsersGetBlockedUsersQueryKey,
} from 'api-client';
import { ShieldOff } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, ConfirmModal, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/auth.svelte';
import UserRow from '$lib/components/user-row.svelte';
import { locale } from '$lib/locale.svelte';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

const query = createChatBlockUsersGetBlockedUsers(() => ({
  query: { enabled: browser && authenticated },
}));

type Row = {
  id: string;
  userId: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
};

const blocked = $derived.by<Row[]>(() => {
  const outer = query.data as Record<string, unknown> | undefined;
  const list = (outer?.blockedUsers as Record<string, unknown>[] | undefined) ?? [];
  return list.map((raw) => {
    const user = (raw.user ?? {}) as Record<string, string | null>;
    return {
      id: String(raw.id ?? ''),
      userId: String(user.id ?? ''),
      name: user.name,
      username: user.username,
      photoURL: user.photoURL,
    };
  });
});

const queryClient = useQueryClient();
let confirmTarget = $state<Row | null>(null);

const unblockMutation = createChatBlockUsersUnblockUser(() => ({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getChatBlockUsersGetBlockedUsersQueryKey() });
      track('user_unblocked', { targetUserId: vars.userId });
      toastState.show(t('network.unblockSuccess'), 'success');
    },
    onError() {
      toastState.show(t('network.unblockError'), 'danger');
    },
  },
}));

function confirmUnblock() {
  const target = confirmTarget;
  confirmTarget = null;
  if (target) unblockMutation.mutate({ userId: target.userId });
}
</script>

<svelte:head>
	<title>{t('network.blockedPageTitle')}</title>
</svelte:head>

<ConfirmModal
	open={confirmTarget !== null}
	onClose={() => (confirmTarget = null)}
	onConfirm={confirmUnblock}
	title={t('network.unblockConfirmTitle', {
		name: confirmTarget?.name ?? confirmTarget?.username ?? '',
	})}
	message={t('network.unblockConfirmMessage')}
	confirmLabel={t('network.unblock')}
	confirmIntent="accent"
/>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-3 sm:px-6">
		<header class="mb-4">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('network.blockedPageTitle')}
			</h1>
		</header>

		<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
			{#if query.isLoading}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each Array(4) as _}
						<div class="flex items-center gap-3 px-4 py-4 sm:px-6">
							<Skeleton shape="avatar" width="3rem" height="3rem" />
							<div class="flex-1 space-y-2">
								<Skeleton shape="text" width="40%" />
								<Skeleton shape="text" width="25%" />
							</div>
							<Skeleton shape="rect" width="6rem" height="2rem" />
						</div>
					{/each}
				</div>
			{:else if blocked.length === 0}
				<EmptyState
					message={t('network.blockedEmpty')}
					icon={ShieldOff as unknown as Component<{ size: number; class?: string }>}
				/>
			{:else}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each blocked as row (row.id)}
						<UserRow
							user={{
								id: row.userId,
								name: row.name,
								username: row.username,
								photoURL: row.photoURL,
							}}
						>
							{#snippet actions()}
								<Button variant="outline" size="sm" onclick={() => (confirmTarget = row)}>
									{t('network.unblock')}
								</Button>
							{/snippet}
						</UserRow>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>
