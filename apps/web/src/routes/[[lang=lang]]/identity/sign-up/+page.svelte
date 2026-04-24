<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createAccountsSignup,
  createSendVerificationHandle,
  getAuthSessionQueryKey,
} from 'api-client';
import { isApiError } from 'api-client/client';
import { Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';
import { PRIVACY_VERSION, TOS_VERSION } from '$lib/utils/consent-versions';
import PasswordStrength from '$lib/components/forms/password-strength.svelte';
import { translateApiError } from '$lib/utils/translate-api-error';

const queryClient = useQueryClient();

let name = $state('');
let email = $state('');
let password = $state('');
// LGPD permits a single combined consent as long as both linked documents are
// reachable. Backend still records two separate UserConsent rows on signup
// (TOS + PRIVACY) — this checkbox just collapses the UI affordance.
let acceptedConsent = $state(false);
let fieldErrors = $state<Record<string, string>>({});
let serverError = $state('');

const t = $derived(locale.t);

// Fire verification email right after signup — the guard redirects the fresh
// session to /identity/verify-email, where the user pastes the code.
const sendVerification = createSendVerificationHandle(() => ({
  mutation: {
    // Ignore errors here; the verify-email page has its own resend button.
    onError() {},
  },
}));

const signup = createAccountsSignup(() => ({
  mutation: {
    async onSuccess() {
      sendVerification.mutate();
      await queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
      goto('/identity/verify-email');
    },
    onError(err: unknown) {
      if (!t) return;
      if (isApiError(err) && err.statusCode === 409) {
        serverError = t('auth.shared.errorEmailInUse');
        return;
      }
      serverError = translateApiError(err, t);
    },
  },
}));

function validate(): boolean {
  const errors: Record<string, string> = {};
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = t?.('auth.shared.errorEmailInvalid') ?? 'Invalid email';
  }
  if (password.length < 8) {
    errors.password = t?.('auth.shared.errorPasswordTooShort') ?? 'Password must have at least 8 characters';
  }
  if (!acceptedConsent) {
    errors.acceptedConsent =
      t?.('auth.sign-up.consent.errorRequired') ?? 'You must accept the Terms and Privacy Policy';
  }
  fieldErrors = errors;
  return Object.keys(errors).length === 0;
}

function handleSubmit(e: Event) {
  e.preventDefault();
  if (!t) return;
  serverError = '';
  if (!validate()) return;
  signup.mutate({
    data: {
      name: name.trim() ? name.trim() : undefined,
      email: email.trim(),
      password,
      acceptedTosVersion: TOS_VERSION,
      acceptedPrivacyVersion: PRIVACY_VERSION,
    },
  });
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
								bind:value={name}
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
								bind:value={email}
								required
								placeholder={t('auth.shared.emailPlaceholder')}
							/>
							{#if fieldErrors.email}
								<p role="alert" class="mt-1 text-xs font-medium text-red-500/80">{fieldErrors.email}</p>
							{/if}
						</div>

						<div class="group relative">
							<Label for="password">
								{t('auth.shared.password')}
							</Label>
							<Input
								id="password"
								type="password"
								bind:value={password}
								required
								placeholder={t('auth.shared.passwordPlaceholder')}
							/>
							<PasswordStrength {password} />
							{#if fieldErrors.password}
								<p role="alert" class="mt-1 text-xs font-medium text-red-500/80">{fieldErrors.password}</p>
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
							{#if fieldErrors.acceptedConsent}
								<p role="alert" class="text-xs font-medium text-red-500/80">{fieldErrors.acceptedConsent}</p>
							{/if}

						</div>
					</div>

					{#if serverError}
						<p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
					{/if}

					<Button
						type="submit"
						disabled={signup.isPending}
						variant="solid"
					>
						{#if signup.isPending}
							<Loader2 size={14} class="mx-auto animate-spin" />
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
