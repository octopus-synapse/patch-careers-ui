<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createUsersCheckUsernameAvailability,
  createUsersGetProfile,
  createUsersUpdateUsername,
  getUsersGetProfileQueryKey,
} from 'api-client';
import { Check, Loader2, X } from 'lucide-svelte';
import { Input, Label } from 'ui';
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

	<section
		class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-800/50"
	>
		<div
			class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800"
		>
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
		<div class="space-y-4 p-5">
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
							<Loader2 size={14} class="animate-spin text-gray-500 dark:text-neutral-500" />
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
				<button
					onclick={handleSaveUsername}
					disabled={updateUsername.isPending || !usernameAvailable || !newUsername}
					class="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-gray-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
				>
					{#if updateUsername.isPending}
						<Loader2 size={13} class="animate-spin" />
					{/if}
					{t('common.save')}
				</button>
			</div>
		</div>
	</section>
</div>
