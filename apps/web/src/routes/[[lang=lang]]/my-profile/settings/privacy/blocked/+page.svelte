<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1ChatBlocked,
  createDeleteV1ChatBlockedUserId,
  getV1ChatBlockedQueryKey,
} from 'api-client';
import type { GetV1ChatBlocked200 } from 'api-client';
import { ShieldOff } from 'lucide-svelte';
import { Button, ConfirmModal, EmptyState, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { asIcon } from '$lib/types/icons';
import { track } from '$lib/utils/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import UserRow from '$lib/components/user/user-row.svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { locale } from '$lib/state/locale.svelte';

type BlockedRow = GetV1ChatBlocked200['blockedUsers'][number];

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);

const query = createGetV1ChatBlocked({
  query: { enabled: browser && authenticated },
});

const blocked = $derived($query.data?.blockedUsers);

const queryClient = useQueryClient();
let confirmTarget = $state<BlockedRow | null>(null);

const unblockMutation = createDeleteV1ChatBlockedUserId({
  mutation: {
    onSuccess(_data, vars) {
      queryClient.invalidateQueries({ queryKey: getV1ChatBlockedQueryKey() });
      track('user_unblocked', { targetUserId: vars.userId });
      toastState.show(t('network.unblockSuccess'), 'success');
    },
    onError(err) {
      handleApiError(err);
    },
  },
});

function confirmUnblock() {
  const target = confirmTarget;
  confirmTarget = null;
  if (target) $unblockMutation.mutate({ userId: target.user.id });
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
		name: confirmTarget?.user.name ?? confirmTarget?.user.username ?? '',
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
			{#if $query.isLoading}
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
			{:else if !blocked || blocked.length === 0}
				<EmptyState
					message={t('network.blockedEmpty')}
					icon={asIcon(ShieldOff)}
				/>
			{:else}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each blocked as row (row.id)}
						<UserRow
							user={{
								id: row.user.id,
								name: row.user.name,
								username: row.user.username,
								photoURL: row.user.photoURL,
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
