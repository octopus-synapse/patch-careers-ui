<script lang="ts">
import { createChangePasswordHandle } from 'api-client';
import { ChangePasswordHandleBody } from 'api-client/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-svelte';
import { Input, Label } from 'ui';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const successText = 'text-emerald-500';
const errorText = 'text-red-500';

let confirmPassword = $state('');
let showCurrentPassword = $state(false);
let showNewPassword = $state(false);
let passwordMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

const changePassword = createChangePasswordHandle(() => ({
  mutation: {
    onSuccess() {
      passwordForm.reset();
      confirmPassword = '';
      passwordMessage = { type: 'success', text: t('settings.passwordChanged') };
      setTimeout(() => (passwordMessage = null), 5000);
    },
    onError() {
      passwordMessage = { type: 'error', text: t('settings.passwordError') };
      setTimeout(() => (passwordMessage = null), 5000);
    },
  },
}));

const passwordForm = createForm({
  schema: ChangePasswordHandleBody,
  initial: { currentPassword: '', newPassword: '' },
  mutation: changePassword,
});

const passwordsMatch = $derived(passwordForm.values.newPassword === confirmPassword);
const passwordValid = $derived(
  passwordForm.values.newPassword.length >= 8 &&
    passwordsMatch &&
    passwordForm.values.currentPassword.length > 0,
);

function handleChangePassword() {
  if (!passwordValid) return;
  passwordForm.submit();
}
</script>

<svelte:head>
	<title>{t('settings.password')} · {t('settings.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-4">
		<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">
			{t('settings.pageTitle')}
		</span>
		<h3 class="text-sm font-bold text-gray-800 dark:text-neutral-200">{t('settings.password')}</h3>
	</div>

	<section
		class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-800/50"
	>
		<div class="border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
			<h2 class="text-xs font-medium text-gray-500 dark:text-neutral-500">
				{t('settings.password')}
			</h2>
		</div>
		<div class="space-y-4 p-5">
			<div>
				<Label for="current-password">{t('settings.currentPassword')}</Label>
				<div class="relative mt-1">
					<Input
						id="current-password"
						type={showCurrentPassword ? 'text' : 'password'}
						bind:value={passwordForm.values.currentPassword}
						class="pr-10"
					/>
					<button
						type="button"
						onclick={() => (showCurrentPassword = !showCurrentPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500"
					>
						{#if showCurrentPassword}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
					</button>
				</div>
			</div>
			<div>
				<Label for="new-password">{t('settings.newPassword')}</Label>
				<div class="relative mt-1">
					<Input
						id="new-password"
						type={showNewPassword ? 'text' : 'password'}
						bind:value={passwordForm.values.newPassword}
						class="pr-10"
					/>
					<button
						type="button"
						onclick={() => (showNewPassword = !showNewPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500"
					>
						{#if showNewPassword}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
					</button>
				</div>
				{#if passwordForm.values.newPassword.length > 0 && passwordForm.values.newPassword.length < 8}
					<p class="mt-1 text-xs {errorText}">{t('settings.passwordMinLength')}</p>
				{/if}
			</div>
			<div>
				<Label for="confirm-password">{t('settings.confirmPassword')}</Label>
				<Input
					id="confirm-password"
					type="password"
					bind:value={confirmPassword}
					class="mt-1"
				/>
				{#if confirmPassword.length > 0 && !passwordsMatch}
					<p class="mt-1 text-xs {errorText}">{t('settings.passwordMismatch')}</p>
				{/if}
			</div>
			{#if passwordMessage}
				<p class="text-xs {passwordMessage.type === 'success' ? successText : errorText}">
					{passwordMessage.text}
				</p>
			{/if}
			<div class="flex justify-end pt-2">
				<button
					onclick={handleChangePassword}
					disabled={changePassword.isPending || !passwordValid}
					class="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-gray-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
				>
					{#if changePassword.isPending}
						<Loader2 size={13} class="animate-spin" />
					{/if}
					{t('settings.changePassword')}
				</button>
			</div>
		</div>
	</section>
</div>
