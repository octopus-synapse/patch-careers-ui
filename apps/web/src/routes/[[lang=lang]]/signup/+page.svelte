<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createAccountsSignup, getAuthSessionQueryKey } from 'api-client';
import { isApiError } from 'api-client/client';
import { Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/locale.svelte';

const queryClient = useQueryClient();

const TOS_VERSION = '1.0.0';
const PRIVACY_VERSION = '1.0.0';

let name = $state('');
let email = $state('');
let password = $state('');
let acceptedTos = $state(false);
let acceptedPrivacy = $state(false);
let fieldErrors = $state<Record<string, string>>({});
let serverError = $state('');

const t = $derived(locale.t);

const signup = createAccountsSignup(() => ({
  mutation: {
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
      goto('/onboarding/start');
    },
    onError(err: unknown) {
      if (!t) return;
      if (isApiError(err)) {
        serverError = err.statusCode === 409 ? t('auth.shared.errorEmailInUse') : err.message;
      } else {
        serverError = t('auth.shared.errorGeneric');
      }
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
  if (!acceptedTos) {
    errors.acceptedTos = t?.('auth.sign-up.consent.errorTosRequired') ?? 'You must accept the Terms of Service';
  }
  if (!acceptedPrivacy) {
    errors.acceptedPrivacy =
      t?.('auth.sign-up.consent.errorPrivacyRequired') ?? 'You must accept the Privacy Policy';
  }
  fieldErrors = errors;
  return Object.keys(errors).length === 0;
}

function handleSubmit(e: Event) {
  e.preventDefault();
  if (!t) return;
  serverError = '';
  if (!validate()) return;
  const body = {
    name: name.trim() ? name.trim() : undefined,
    email: email.trim(),
    password,
    acceptedTosVersion: TOS_VERSION,
    acceptedPrivacyVersion: PRIVACY_VERSION,
  };
  // biome-ignore lint/suspicious/noExplicitAny: orval-generated schema lags backend until openapi regen
  signup.mutate({ data: body as any });
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
								<p class="mt-1 text-xs font-medium text-red-500/80">{fieldErrors.email}</p>
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
							{#if fieldErrors.password}
								<p class="mt-1 text-xs font-medium text-red-500/80">{fieldErrors.password}</p>
							{/if}
						</div>

						<div class="space-y-2 pt-2">
							<label class="flex items-start gap-2 cursor-pointer text-xs text-gray-600 dark:text-neutral-400">
								<input
									type="checkbox"
									bind:checked={acceptedTos}
									class="mt-0.5"
									required
								/>
								<span>
									{t('auth.sign-up.consent.tosPrefix')}
									<a href="/legal/termos" target="_blank" rel="noopener" class="underline">
										{t('auth.sign-up.consent.tosLink')}
									</a>
								</span>
							</label>
							{#if fieldErrors.acceptedTos}
								<p class="text-xs font-medium text-red-500/80">{fieldErrors.acceptedTos}</p>
							{/if}

							<label class="flex items-start gap-2 cursor-pointer text-xs text-gray-600 dark:text-neutral-400">
								<input
									type="checkbox"
									bind:checked={acceptedPrivacy}
									class="mt-0.5"
									required
								/>
								<span>
									{t('auth.sign-up.consent.privacyPrefix')}
									<a href="/legal/privacidade" target="_blank" rel="noopener" class="underline">
										{t('auth.sign-up.consent.privacyLink')}
									</a>
								</span>
							</label>
							{#if fieldErrors.acceptedPrivacy}
								<p class="text-xs font-medium text-red-500/80">{fieldErrors.acceptedPrivacy}</p>
							{/if}
						</div>
					</div>

					{#if serverError}
						<p class="text-xs font-medium text-red-500/80">{serverError}</p>
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
						<a href="/login" class="ml-1 font-bold text-gray-800 dark:text-neutral-200 hover:underline">
							{t('auth.sign-up.footerLink')}
						</a>
					</p>
				</footer>
			</div>
		</main>
	</div>
{/if}
