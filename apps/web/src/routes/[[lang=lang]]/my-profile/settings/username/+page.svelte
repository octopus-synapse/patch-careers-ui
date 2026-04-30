<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createUsersCheckUsernameAvailability,
  createUsersGetProfile,
  createUsersUpdateUsername,
  getUsersGetProfileQueryKey,
} from 'api-client';
import { Check, X } from 'lucide-svelte';
import { Button, Card, Input, Label, Loader } from 'ui';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

const successText = 'text-emerald-500';
const errorText = 'text-red-500';

const profileQuery = createUsersGetProfile(() => ({
  query: { enabled: browser },
}));
const profileData = $derived(profileQuery.data as Record<string, string> | undefined);
const currentUsername = $derived(profileData?.username ?? '');

let newUsername = $state('');
let usernameDebounceTimer = $state<ReturnType<typeof setTimeout> | null>(null);
let debouncedUsername = $state('');
let usernameSaved = $state(false);

$effect(() => {
  if (usernameDebounceTimer) clearTimeout(usernameDebounceTimer);
  if (newUsername.length >= 3) {
    usernameDebounceTimer = setTimeout(() => {
      debouncedUsername = newUsername;
    }, 500);
  } else {
    debouncedUsername = '';
  }
});

const usernameCheck = createUsersCheckUsernameAvailability(
  () => ({ username: debouncedUsername }),
  () => ({ query: { enabled: browser && debouncedUsername.length >= 3 } }),
);
const usernameAvailable = $derived(
  (usernameCheck.data as Record<string, boolean> | undefined)?.available,
);

const updateUsername = createUsersUpdateUsername(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getUsersGetProfileQueryKey() });
      newUsername = '';
      debouncedUsername = '';
      usernameSaved = true;
      setTimeout(() => (usernameSaved = false), 3000);
    },
  },
}));

function handleSaveUsername() {
  if (newUsername && usernameAvailable) {
    updateUsername.mutate({ data: { username: newUsername } });
  }
}
</script>

<svelte:head>
	<title>{t('settings.username')} · {t('settings.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-4">
		<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">
			{t('settings.pageTitle')}
		</span>
		<h3 class="text-sm font-bold text-gray-800 dark:text-neutral-200">{t('settings.username')}</h3>
	</div>

	<Card>
		{#snippet title()}
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-medium text-gray-500 dark:text-neutral-500">
					{t('settings.username')}
				</h2>
				{#if usernameSaved}
					<span class="flex items-center gap-1 text-xs {successText}">
						<Check size={14} />
						{t('settings.saved')}
					</span>
				{/if}
			</div>
		{/snippet}
		<div class="space-y-4">
			<div>
				<span class="text-xs font-semibold text-gray-500 dark:text-neutral-500"
					>{t('settings.currentUsername')}</span
				>
				<p class="mt-1 text-sm text-gray-800 dark:text-neutral-200">@{currentUsername || '---'}</p>
			</div>
			<div>
				<Label for="new-username">{t('settings.newUsername')}</Label>
				<div class="relative mt-1">
					<Input
						id="new-username"
						type="text"
						bind:value={newUsername}
						placeholder={t('settings.usernamePlaceholder')}
						class="pr-10"
					/>
					{#if debouncedUsername.length >= 3 && !usernameCheck.isLoading}
						<div class="absolute right-3 top-1/2 -translate-y-1/2">
							{#if usernameAvailable}
								<Check size={16} class={successText} />
							{:else}
								<X size={16} class={errorText} />
							{/if}
						</div>
					{/if}
					{#if usernameCheck.isLoading}
						<div class="absolute right-3 top-1/2 -translate-y-1/2">
							<Loader size={14} />
						</div>
					{/if}
				</div>
				{#if debouncedUsername.length >= 3 && !usernameCheck.isLoading}
					<p class="mt-1 text-xs {usernameAvailable ? successText : errorText}">
						{usernameAvailable ? t('settings.usernameAvailable') : t('settings.usernameTaken')}
					</p>
				{/if}
			</div>
			<p class="text-[10px] text-gray-500 dark:text-neutral-500">{t('settings.usernameNote')}</p>
			<div class="flex justify-end pt-2">
				<Button
					variant="solid"
					size="md"
					textCase="normal"
					onclick={handleSaveUsername}
					disabled={updateUsername.isPending || !usernameAvailable || !newUsername}
				>
					{#if updateUsername.isPending}
						<Loader size={13} />
					{/if}
					{t('common.save')}
				</Button>
			</div>
		</div>
	</Card>
</div>
