<script lang="ts">
	import { createAccountsSignup } from 'api-client';
	import type { CreateAccountDto } from 'api-client';
	import { isApiError } from 'api-client/client';
	import { loadDictionary, createTranslator, DEFAULT_LOCALE } from 'i18n';
	import type { Translator } from 'i18n';
	import { Button, Input, Label } from 'ui';
	import { goto } from '$app/navigation';
	import { Loader2 } from 'lucide-svelte';
	import { colorSchema } from '$lib/color-schema.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let t = $state<Translator | null>(null);

	const cs = $derived(colorSchema.mode);
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');

	$effect(() => {
		loadDictionary(DEFAULT_LOCALE).then((dict) => {
			t = createTranslator(dict);
		});
	});

	const signup = createAccountsSignup(() => ({
		mutation: {
			onSuccess() {
				goto('/');
			},
			onError(err: unknown) {
				if (!t) return;
				if (isApiError(err)) {
					error = err.statusCode === 409
						? t('auth.shared.errorEmailInUse')
						: err.message;
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
		if (password.length < 8) {
			error = t('auth.shared.errorPasswordTooShort');
			return;
		}
		const data: CreateAccountDto = { email, password, ...(name.trim() && { name: name.trim() }) };
		signup.mutate({ data });
	}
</script>

<svelte:head>
	<title>{t?.('auth.sign-up.pageTitle') ?? ''}</title>
</svelte:head>

{#if t}
	<div class="selection:bg-black selection:text-white min-h-screen font-sans antialiased transition-colors duration-300">
		<main class="flex min-h-screen items-center justify-center p-6 pt-20">
			<div class="w-full max-w-[340px]">
				<div class="mb-10">
					<h1 class="text-xl font-medium tracking-tight {text}">
						{t('auth.sign-up.title')}
					</h1>
					<p class="text-sm {muted}">
						{t('auth.sign-up.subtitle')}
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="space-y-4">
						<div class="group relative">
							<Label for="name" colorSchema={cs}>
								{t('auth.shared.fullName')}
							</Label>
							<Input
								id="name"
								type="text"
								bind:value={name}
								placeholder={t('auth.shared.fullNamePlaceholder')}
								colorSchema={cs}
							/>
						</div>

						<div class="group relative">
							<Label for="email" colorSchema={cs}>
								{t('auth.shared.email')}
							</Label>
							<Input
								id="email"
								type="email"
								bind:value={email}
								required
								placeholder={t('auth.shared.emailPlaceholder')}
								colorSchema={cs}
							/>
						</div>

						<div class="group relative">
							<Label for="password" colorSchema={cs}>
								{t('auth.shared.password')}
							</Label>
							<Input
								id="password"
								type="password"
								bind:value={password}
								required
								placeholder={t('auth.shared.passwordPlaceholder')}
								colorSchema={cs}
							/>
						</div>
					</div>

					{#if error}
						<p class="text-xs font-medium text-red-500/80">{error}</p>
					{/if}

					<Button
						type="submit"
						disabled={signup.isPending}
						variant="solid"
						colorSchema={cs}
					>
						{#if signup.isPending}
							<Loader2 size={14} class="mx-auto animate-spin" />
						{:else}
							{t('auth.sign-up.submit')}
						{/if}
					</Button>
				</form>

				<footer class="mt-12 text-center">
					<p class="text-xs {muted}">
						{t('auth.sign-up.footer')}
						<a href="/login" class="ml-1 font-bold {text} hover:underline">
							{t('auth.sign-up.footerLink')}
						</a>
					</p>
				</footer>
			</div>
		</main>
	</div>
{/if}
