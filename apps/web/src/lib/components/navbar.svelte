<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { createAuthSession } from 'api-client';
	import { loadDictionary, createTranslator, DEFAULT_LOCALE } from 'i18n';
	import type { Translator } from 'i18n';
	import { Menu, X } from 'lucide-svelte';
	import ColorSchemaToggle from './color-schema-toggle.svelte';

	const cs = $derived(colorSchema.mode);

	let isMenuOpen = $state(false);
	let t = $state<Translator | null>(null);

	$effect(() => {
		loadDictionary(DEFAULT_LOCALE).then((dict) => {
			t = createTranslator(dict);
		});
	});

	const session = createAuthSession(() => ({
		query: {
			retry: false
		}
	}));
	const user = $derived(session.data?.data?.data?.user);
	const authenticated = $derived(session.data?.data?.data?.authenticated ?? false);

	function closeMenu() {
		isMenuOpen = false;
	}

	const s = {
		border: { light: 'border-gray-200/60', dark: 'border-neutral-800/60' },
		text: { light: 'text-gray-800', dark: 'text-neutral-200' },
		muted: { light: 'text-gray-500', dark: 'text-neutral-500' },
		bg: { light: 'bg-gray-50/80', dark: 'bg-neutral-900/80' },
		mobileBg: { light: 'bg-gray-50', dark: 'bg-neutral-900' },
		link: {
			light: 'text-gray-500 hover:text-gray-800',
			dark: 'text-neutral-500 hover:text-neutral-200'
		},
		join: {
			light: 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-gray-50',
			dark: 'border-neutral-200 text-neutral-200 hover:bg-neutral-200 hover:text-neutral-900'
		},
		cta: {
			light: 'bg-gray-800 text-gray-50',
			dark: 'bg-neutral-200 text-neutral-900'
		}
	};

	const navLinks = [
		{ key: 'nav.jobs', href: '/jobs' },
		{ key: 'nav.companies', href: '/companies' },
		{ key: 'nav.about', href: '/about' }
	];
</script>

{#if t}
	<nav class="fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md transition-colors duration-300 {s.border[cs]} {s.bg[cs]}">
		<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
			<a href="/" class="text-sm font-bold tracking-tight {s.text[cs]}">
				patch<span class="font-light opacity-40">careers</span>
			</a>

			<div class="hidden items-center gap-8 md:flex">
				{#each navLinks as link}
					<a
						href={link.href}
						class="text-[10px] font-semibold uppercase tracking-widest transition-colors {s.link[cs]}"
					>
						{t(link.key)}
					</a>
				{/each}
			</div>

			<div class="flex items-center gap-4">
				<div class="hidden md:block">
					<ColorSchemaToggle />
				</div>

				{#if authenticated && user}
					<a
						href="/dashboard"
						class="hidden items-center gap-3 md:flex"
					>
						<div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold {s.cta[cs]}">
							{(user.name ?? user.email).charAt(0).toUpperCase()}
						</div>
						<div class="hidden lg:block">
							<p class="text-xs font-semibold leading-tight {s.text[cs]}">{user.name ?? user.email.split('@')[0]}</p>
							<p class="text-[10px] leading-tight {s.muted[cs]}">{user.email}</p>
						</div>
					</a>
				{:else}
					<a
						href="/login"
						class="hidden text-[10px] font-semibold uppercase tracking-widest transition-colors md:block {s.link[cs]}"
					>
						{t('nav.login')}
					</a>
					<a
						href="/signup"
						class="hidden rounded-full border px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all md:block {s.join[cs]}"
					>
						{t('nav.join')}
					</a>
				{/if}

				<button
					onclick={() => (isMenuOpen = !isMenuOpen)}
					class="rounded-lg p-1.5 transition-colors md:hidden {s.muted[cs]}"
					aria-label={isMenuOpen ? t('nav.close') : t('nav.menu')}
				>
					{#if isMenuOpen}
						<X size={20} />
					{:else}
						<Menu size={20} />
					{/if}
				</button>
			</div>
		</div>

		{#if isMenuOpen}
			<div class="fixed inset-0 top-[57px] z-40 p-8 md:hidden {s.mobileBg[cs]}">
				<div class="flex h-full flex-col justify-between">
					<div class="flex flex-col gap-8 pt-4">
						{#each navLinks as link}
							<a
								href={link.href}
								onclick={closeMenu}
								class="text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 {s.text[cs]}"
							>
								{t(link.key)}
							</a>
						{/each}
					</div>

					<div class="flex flex-col gap-6 pb-8">
						{#if authenticated && user}
							<div class="flex items-center gap-3 border-t pt-6 {s.border[cs]}">
								<div class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold {s.cta[cs]}">
									{(user.name ?? user.email).charAt(0).toUpperCase()}
								</div>
								<div>
									<p class="text-sm font-semibold {s.text[cs]}">{user.name ?? user.email.split('@')[0]}</p>
									<p class="text-xs {s.muted[cs]}">{user.email}</p>
								</div>
							</div>

							<a
								href="/dashboard"
								onclick={closeMenu}
								class="w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] {s.cta[cs]}"
							>
								Dashboard
							</a>
						{:else}
							<div class="flex items-center justify-between border-t pt-6 {s.border[cs]}">
								<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">
									{t('nav.theme')}
								</span>
								<ColorSchemaToggle />
							</div>

							<a
								href="/signup"
								onclick={closeMenu}
								class="w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] {s.cta[cs]}"
							>
								{t('nav.getStarted')}
							</a>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</nav>
{/if}
