<script lang="ts">
	import { createAccountsSignup, getAuthSessionQueryKey } from 'api-client';
	import { AccountsSignupBody } from 'api-client/zod';
	import { isApiError } from 'api-client/client';
	import { Button, Input, Label } from 'ui';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Loader2 } from 'lucide-svelte';
	import { locale } from '$lib/locale.svelte';
	import { createForm } from '$lib/forms/create-form.svelte';

	const queryClient = useQueryClient();

	let serverError = $state('');

	const t = $derived(locale.t);

	const signup = createAccountsSignup(() => ({
		mutation: {
			async onSuccess() {
				await queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
				goto('/onboarding');
			},
			onError(err: unknown) {
				if (!t) return;
				if (isApiError(err)) {
					serverError = err.statusCode === 409
						? t('auth.shared.errorEmailInUse')
						: err.message;
				} else {
					serverError = t('auth.shared.errorGeneric');
				}
			}
		}
	}));

	const form = createForm({
		schema: AccountsSignupBody,
		initial: { name: '', email: '', password: '' },
		mutation: signup,
		transform: (v) => ({
			...v,
			name: v.name?.trim() ? v.name.trim() : undefined
		})
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!t) return;
		serverError = '';
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
							{#if form.errors.name}
								<p class="mt-1 text-xs font-medium text-red-500/80">{form.errors.name}</p>
							{/if}
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
						<p class="text-xs font-medium text-red-500/80">{serverError}</p>
					{/if}

					<Button
						type="submit"
						disabled={form.isSubmitting}
						variant="solid"
					>
						{#if form.isSubmitting}
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
