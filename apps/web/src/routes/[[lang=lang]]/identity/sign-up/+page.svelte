<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createSignup,
  createPostV1AuthEmailVerificationSend,
  sessionQueryKey,
  isApiError,
} from 'api-client';
import { signupMutationRequestSchema } from 'api-client/zod';

import { Button, Input, Label, Loader } from 'ui';
import { goto } from '$app/navigation';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';
import { PRIVACY_VERSION, TOS_VERSION } from '$lib/utils/consent-versions';
import PasswordStrength from '$lib/components/forms/password-strength.svelte';

const queryClient = useQueryClient();

let acceptedConsent = $state(false);
let acceptedConsentError = $state('');
let serverError = $state('');

const t = $derived(locale.t);

const sendVerification = createPostV1AuthEmailVerificationSend({
  mutation: { onError() {} },
});

const signup = createSignup({
  mutation: {
    async onSuccess() {
      $sendVerification.mutate();
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
      goto('/identity/verify-email');
    },
    onError(err: unknown) {
      if (isApiError(err)) serverError = err.message;
    },
  },
});

const form = createForm({
  schema: signupMutationRequestSchema,
  initial: {
    name: '',
    email: '',
    password: '',
    acceptedTosVersion: TOS_VERSION,
    acceptedPrivacyVersion: PRIVACY_VERSION,
  },
  mutation: signup,
  transform: (v) => ({
    ...v,
    name: v.name?.trim() ? v.name.trim() : undefined,
    email: v.email.trim(),
  }),
});

function handleSubmit(e: Event) {
  e.preventDefault();
  if (!t) return;
  serverError = '';
  acceptedConsentError = '';
  if (!acceptedConsent) {
    acceptedConsentError = t('auth.sign-up.consent.errorRequired');
    return;
  }
  form.submit();
}
</script>

<svelte:head>
	<title>{t('auth.sign-up.pageTitle')}</title>
</svelte:head>

{#if t}
	<div class="selection:bg-black selection:text-white min-h-screen font-sans antialiased transition-colors duration-300">
		<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
			<div class="w-full max-w-[340px]">
				<div class="mb-10">
					<h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
						{t('auth.sign-up.title')}
					</h1>
					<p class="text-sm text-gray-500 dark:text-neutral-500">
						{t('auth.sign-up.subtitle')}
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="space-y-4">
						<div class="group relative">
							<Label for="name">
								{t('auth.shared.fullName')}
							</Label>
							<Input
								id="name"
								type="text"
								bind:value={form.values.name}
								placeholder={t('auth.shared.fullNamePlaceholder')}
							/>
						</div>

						<div class="group relative">
							<Label for="email">
								{t('auth.shared.email')}
							</Label>
							<Input
								id="email"
								type="email"
								bind:value={form.values.email}
								required
								placeholder={t('auth.shared.emailPlaceholder')}
							/>
							{#if form.errors.email}
								<p role="alert" class="mt-1 text-xs font-medium text-red-500/80">{form.errors.email}</p>
							{/if}
						</div>

						<div class="group relative">
							<Label for="password">
								{t('auth.shared.password')}
							</Label>
							<Input
								id="password"
								type="password"
								bind:value={form.values.password}
								required
								placeholder={t('auth.shared.passwordPlaceholder')}
							/>
							<PasswordStrength password={form.values.password} />
							{#if form.errors.password}
								<p role="alert" class="mt-1 text-xs font-medium text-red-500/80">{form.errors.password}</p>
							{/if}
						</div>

						<div class="space-y-2 pt-2">
							<label class="flex items-start gap-2 cursor-pointer text-xs text-gray-600 dark:text-neutral-400">
								<input
									type="checkbox"
									bind:checked={acceptedConsent}
									class="mt-0.5"
									required
								/>
								<span>
									{t('auth.sign-up.consent.combinedPrefix')}
									<a href="/legal/terms" target="_blank" rel="noopener" class="underline">
										{t('auth.sign-up.consent.tosLink')}
									</a>
									{t('auth.sign-up.consent.combinedAnd')}
									<a href="/legal/privacy" target="_blank" rel="noopener" class="underline">
										{t('auth.sign-up.consent.privacyLink')}
									</a>
								</span>
							</label>
							{#if acceptedConsentError}
								<p role="alert" class="text-xs font-medium text-red-500/80">{acceptedConsentError}</p>
							{/if}

						</div>
					</div>

					{#if serverError}
						<p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
					{/if}

					<Button
						type="submit"
						disabled={form.isSubmitting}
						variant="solid"
					>
						{#if form.isSubmitting}
							<Loader size={14} class="mx-auto" />
						{:else}
							{t('auth.sign-up.submit')}
						{/if}
					</Button>
				</form>

				<footer class="mt-12 text-center">
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						{t('auth.sign-up.footer')}
						<a href="/identity/sign-in" class="ml-1 font-bold text-gray-800 dark:text-neutral-200 hover:underline">
							{t('auth.sign-up.footerLink')}
						</a>
					</p>
				</footer>
			</div>
		</main>
	</div>
{/if}
