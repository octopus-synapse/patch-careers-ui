<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { createAuthSession, createAuthLogout, getAuthSessionQueryKey } from 'api-client';
	import type { Locale } from 'i18n';
	import { Menu, X, Sun, Moon } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import NavLogo from './nav-logo.svelte';
	import NavUserDropdown from './nav-user-dropdown.svelte';
	import NavMobileMenu from './nav-mobile-menu.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);

	let isMenuOpen = $state(false);
	let isDropdownOpen = $state(false);

	const session = createAuthSession(() => ({
		query: { retry: false }
	}));
	const user = $derived(session.data?.data?.data?.user);
	const authenticated = $derived(session.data?.data?.data?.authenticated ?? false);

	const queryClient = useQueryClient();
	const logout = createAuthLogout(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
				isDropdownOpen = false;
				goto('/login');
			}
		}
	}));

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-dropdown]')) {
			isDropdownOpen = false;
		}
	}

	$effect(() => {
		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	function handleThemeToggle(value: string) {
		if (value !== cs) colorSchema.toggle();
	}

	function handleLocaleChange(value: string) {
		locale.set(value as Locale);
	}

	function handleLogout() {
		logout.mutate({ data: {} });
	}

	const s = {
		border: { light: 'border-gray-200/60', dark: 'border-neutral-800/60' },
		text: { light: 'text-gray-800', dark: 'text-neutral-200' },
		muted: { light: 'text-gray-500', dark: 'text-neutral-500' },
		bg: { light: 'bg-gray-50/80', dark: 'bg-neutral-900/80' },
		mobileBg: { light: 'bg-gray-50', dark: 'bg-neutral-900' },
		dropdownBg: { light: 'bg-white', dark: 'bg-neutral-800' },
		segmentBg: { light: 'bg-gray-100', dark: 'bg-neutral-700/50' },
		segmentActive: { light: 'bg-white shadow-sm', dark: 'bg-neutral-600' },
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
	<nav class="fixed top-0 right-0 left-0 z-50 border-b transition-colors duration-300 {s.border[cs]} {isMenuOpen ? s.mobileBg[cs] : 'backdrop-blur-md ' + s.bg[cs]}">
		<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
			<NavLogo textClass={s.text[cs]} />

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
				{#if authenticated && user}
					<NavUserDropdown
						{user}
						{cs}
						isOpen={isDropdownOpen}
						styles={s}
						themeLabel={t('nav.theme')}
						logoutLabel={t('dashboard.logout')}
						locales={locale.locales}
						currentLocale={locale.current}
						ontoggle={() => isDropdownOpen = !isDropdownOpen}
						onthemetoggle={handleThemeToggle}
						onlocalechange={handleLocaleChange}
						onlogout={handleLogout}
					/>
				{:else}
					<div class="hidden items-center gap-4 md:flex">
						<button
							onclick={() => colorSchema.toggle()}
							class="rounded-lg p-2 transition-colors {s.muted[cs]}"
							aria-label="Toggle color schema"
						>
							{#if cs === 'dark'}<Sun size={16} />{:else}<Moon size={16} />{/if}
						</button>
						<a
							href="/login"
							class="text-[10px] font-semibold uppercase tracking-widest transition-colors {s.link[cs]}"
						>
							{t('nav.login')}
						</a>
						<a
							href="/signup"
							class="rounded-full border px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all {s.join[cs]}"
						>
							{t('nav.join')}
						</a>
					</div>
				{/if}

				<button
					onclick={() => (isMenuOpen = !isMenuOpen)}
					class="rounded-lg p-1.5 transition-colors md:hidden {s.muted[cs]}"
					aria-label={isMenuOpen ? t('nav.close') : t('nav.menu')}
				>
					{#if isMenuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
				</button>
			</div>
		</div>

		{#if isMenuOpen}
			<NavMobileMenu
				{cs}
				{authenticated}
				{user}
				{navLinks}
				styles={s}
				{t}
				locales={locale.locales}
				currentLocale={locale.current}
				onclose={() => isMenuOpen = false}
				onthemetoggle={handleThemeToggle}
				onlocalechange={handleLocaleChange}
				onlogout={handleLogout}
			/>
		{/if}
	</nav>
{/if}
