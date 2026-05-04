<script lang="ts">
import { createPasswordManagementMePasswordChange } from 'api-client';
import { passwordManagementMePasswordChangeMutationRequestSchema } from 'api-client/zod';
import { Eye, EyeOff } from 'lucide-svelte';
import { Button, Card, Input, Label, Loader } from 'ui';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const successText = 'text-emerald-500';
const errorText = 'text-red-500';

let confirmPassword = $state('');
let showCurrentPassword = $state(false);
let showNewPassword = $state(false);
let passwordMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

const changePassword = createPasswordManagementMePasswordChange({
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
});

const passwordForm = createForm({
  schema: passwordManagementMePasswordChangeMutationRequestSchema,
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

	<Card>
		{#snippet title()}
			<h2 class="text-xs font-medium text-gray-500 dark:text-neutral-500">
				{t('settings.password')}
			</h2>
		{/snippet}
		<div class="space-y-4">
			<div>
				<Label for="current-password">{t('settings.currentPassword')}</Label>
				<div class="relative mt-1">
					<Input
						id="current-password"
						type={showCurrentPassword ? 'text' : 'password'}
						bind:value={passwordForm.values.currentPassword}
						class="pr-10"
					/>
					<Button
						variant="icon"
						size="xs"
						onclick={() => (showCurrentPassword = !showCurrentPassword)}
						aria-label={showCurrentPassword ? t('settings.hidePassword') : t('settings.showPassword')}
						class="absolute right-1 top-1/2 -translate-y-1/2"
					>
						{#if showCurrentPassword}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
					</Button>
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
					<Button
						variant="icon"
						size="xs"
						onclick={() => (showNewPassword = !showNewPassword)}
						aria-label={showNewPassword ? t('settings.hidePassword') : t('settings.showPassword')}
						class="absolute right-1 top-1/2 -translate-y-1/2"
					>
						{#if showNewPassword}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
					</Button>
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
				<Button
					variant="solid"
					size="md"
					textCase="normal"
					onclick={handleChangePassword}
					disabled={$changePassword.isPending || !passwordValid}
				>
					{#if $changePassword.isPending}
						<Loader size={13} />
					{/if}
					{t('settings.changePassword')}
				</Button>
			</div>
		</div>
	</Card>
</div>
