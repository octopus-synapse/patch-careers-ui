<script lang="ts">
	import { createAuthLogin } from 'api-client';
	import type { LoginDto } from 'api-client';
	import { isApiError } from 'api-client/client';
	import { Button, Input, Label } from 'ui';
	import { goto } from '$app/navigation';
	import { Loader2 } from 'lucide-svelte';
	import { locale } from '$lib/locale.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');

	const t = $derived(locale.t);

	const login = createAuthLogin(() => ({
		mutation: {
			onSuccess() {
				goto('/dashboard');
			},
			onError(err: unknown) {
				if (!t) return;
				if (isApiError(err) && err.statusCode === 401) {
					error = t('auth.shared.errorInvalidCredentials');
				} else {
					error = t('auth.shared.errorGeneric');
				}
			}
		}
	}));

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		if (!t) return;
		const data: LoginDto = { email, password };
		login.mutate({ data });
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
								bind:value={email}
								required
								placeholder={t('auth.shared.emailPlaceholder')}
							/>
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
						</div>
					</div>

					{#if error}
						<p class="text-xs font-medium text-red-500/80">{error}</p>
					{/if}

					<Button
						type="submit"
						disabled={login.isPending}
						variant="solid"
					>
						{#if login.isPending}
							<Loader2 size={14} class="mx-auto animate-spin" />
						{:else}
							{t('auth.sign-in.submit')}
						{/if}
					</Button>
				</form>

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
