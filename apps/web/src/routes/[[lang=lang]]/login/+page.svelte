<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createAuthLogin, getAuthSessionQueryKey } from 'api-client';
import { isApiError } from 'api-client/client';
import { AuthLoginBody } from 'api-client/zod';
import { Loader2 } from 'lucide-svelte';
import { Button, Input, Label } from 'ui';
import { goto } from '$app/navigation';
import { createForm } from '$lib/forms/create-form.svelte';
import { locale } from '$lib/locale.svelte';

const queryClient = useQueryClient();

let serverError = $state('');

const t = $derived(locale.t);

const login = createAuthLogin(() => ({
  mutation: {
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
      goto('/dashboard');
    },
    onError(err: unknown) {
      if (!t) return;
      if (isApiError(err) && err.statusCode === 401) {
        serverError = t('auth.shared.errorInvalidCredentials');
      } else {
        serverError = t('auth.shared.errorGeneric');
      }
    },
  },
}));

const form = createForm({
  schema: AuthLoginBody,
  initial: { email: '', password: '' },
  mutation: login,
});

function handleSubmit(e: Event) {
  e.preventDefault();
  if (!t) return;
  serverError = '';
  form.submit();
}
</script>

<svelte:head>
	<title>{t('auth.sign-in.pageTitle')}</title>
</svelte:head>

{#if t}
	<div class="selection:bg-black selection:text-white min-h-screen font-sans antialiased transition-colors duration-300">
		<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6">
			<div class="w-full max-w-[340px]">
				<div class="mb-10">
					<h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
						{t('auth.sign-in.title')}
					</h1>
					<p class="text-sm text-gray-500 dark:text-neutral-500">
						{t('auth.sign-in.subtitle')}
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="space-y-4">
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
								<p class="mt-1 text-xs font-medium text-red-500/80">{form.errors.email}</p>
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
							{#if form.errors.password}
								<p class="mt-1 text-xs font-medium text-red-500/80">{form.errors.password}</p>
							{/if}
						</div>
					</div>

					{#if serverError}
						<p class="text-xs font-medium text-red-500/80" role="alert">{serverError}</p>
					{/if}

					<Button
						type="submit"
						disabled={form.isSubmitting}
						variant="solid"
					>
						{#if form.isSubmitting}
							<Loader2 size={14} class="mx-auto animate-spin" />
						{:else}
							{t('auth.sign-in.submit')}
						{/if}
					</Button>

					<div class="text-center">
						<a
							href="/forgot-password"
							class="text-xs text-gray-500 hover:underline dark:text-neutral-500"
						>
							{t('auth.sign-in.forgotPassword') ?? 'Esqueci minha senha'}
						</a>
					</div>
				</form>

				<div class="mt-6">
					<div class="relative">
						<div class="absolute inset-0 flex items-center" aria-hidden="true">
							<div class="w-full border-t border-gray-200 dark:border-neutral-800"></div>
						</div>
						<div class="relative flex justify-center text-xs">
							<span class="bg-white px-2 text-gray-400 dark:bg-neutral-900 dark:text-neutral-500">
								ou
							</span>
						</div>
					</div>
					<div class="mt-4 grid grid-cols-2 gap-2">
						<a
							href="/api/v1/auth/oauth/github/start"
							class="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
						>
							GitHub
						</a>
						<a
							href="/api/v1/auth/oauth/linkedin/start"
							class="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
						>
							LinkedIn
						</a>
					</div>
				</div>

				<footer class="mt-12 text-center">
					<p class="text-xs text-gray-500 dark:text-neutral-500">
						{t('auth.sign-in.footer')}
						<a href="/signup" class="ml-1 font-bold text-gray-800 dark:text-neutral-200 hover:underline">
							{t('auth.sign-in.footerLink')}
						</a>
					</p>
				</footer>
			</div>
		</main>
	</div>
{/if}
