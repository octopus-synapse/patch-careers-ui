<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { createAuthSession, createAuthLogout, getAuthSessionQueryKey } from 'api-client';
	import type { Locale } from 'i18n';
	import { Button } from 'ui';
	import { Menu, X, Search, Briefcase, Users, MessageCircle, Shield, Rss } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';
	import NavLogo from './nav-logo.svelte';
	import NavUserDropdown from './nav-user-dropdown.svelte';
	import NavMobileMenu from './nav-mobile-menu.svelte';
	import NavSearchModal from './nav-search-modal.svelte';
	import { chatState } from '$lib/chat-state.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import NotificationBell from './notification-bell.svelte';

	const isLanding = $derived($page.url.pathname === '/');

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);

	let isMenuOpen = $state(false);
	let isDropdownOpen = $state(false);
	let isSearchOpen = $state(false);

	const session = createAuthSession(() => ({
		query: { retry: false, enabled: browser }
	}));
	const user = $derived(session.data?.user);
	const authenticated = $derived(session.data?.authenticated);
	const hasCompletedOnboarding = $derived(user?.hasCompletedOnboarding);
	const isAdmin = $derived(Boolean(user?.isAdmin));

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

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			isSearchOpen = !isSearchOpen;
		}
	}

	const navLinks = [
		{ key: 'Feed', href: '/feed', icon: Rss },
		{ key: 'nav.jobs', href: '/jobs', icon: Briefcase },
		{ key: 'nav.myNetwork', href: '/mynetwork', icon: Users }
	];
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if t}
	<NavSearchModal open={isSearchOpen} {t} onclose={() => isSearchOpen = false} />

	<nav class="fixed top-0 right-0 left-0 z-50 transition-colors duration-300
		{isLanding ? 'border-transparent' : 'border-b border-gray-200/60 dark:border-neutral-800/60'}
		{isLanding ? 'bg-transparent' : isMenuOpen ? 'bg-gray-50 dark:bg-neutral-900' : 'backdrop-blur-md bg-gray-50/80 dark:bg-neutral-900/80'}">
		<div class="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-6">
			<div class="flex shrink-0 items-center">
				<NavLogo textClass={isLanding ? 'text-white' : 'text-gray-800 dark:text-neutral-200'} />
			</div>

			{#if hasCompletedOnboarding}
				<div class="mx-auto hidden max-w-md flex-1 px-4 lg:px-8 md:block">
					<button
						onclick={() => isSearchOpen = true}
						class="flex w-full items-center gap-2 rounded-lg border py-1.5 pr-2 pl-3 transition-colors bg-gray-100/80 dark:bg-neutral-800/80 text-gray-400 dark:text-neutral-500 placeholder-gray-400 dark:placeholder-neutral-500 border-gray-200/60 dark:border-neutral-700/60"
					>
						<Search size={14} class="text-gray-500 dark:text-neutral-500" />
						<span class="flex-1 text-left text-xs">{t('nav.search')}</span>
						<kbd class="rounded border px-1.5 py-0.5 text-[10px] font-medium bg-gray-100/80 dark:bg-neutral-800/80 text-gray-400 dark:text-neutral-500 border-gray-200/60 dark:border-neutral-700/60">⌘K</kbd>
					</button>
				</div>
			{:else}
				<div class="flex-1"></div>
			{/if}

			<div class="flex shrink-0 items-center gap-1">
				{#if hasCompletedOnboarding}
					<div class="hidden items-center gap-1 md:flex">
						{#each navLinks as link}
							<a
								href={link.href}
								class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200"
							>
								<link.icon size={14} />
								{t(link.key)}
							</a>
						{/each}

						{#if authenticated}
							<Button variant="ghost" size="sm" onclick={() => chatState.toggle()}>
								<MessageCircle size={14} />
								{t('nav.messages')}
							</Button>

							<NotificationBell />
						{/if}

						{#if isAdmin}
							<a
								href="/admin"
								class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200"
							>
								<Shield size={14} />
								Admin
							</a>
						{/if}

						<div class="mx-2 h-4 w-px border-gray-200/60 dark:border-neutral-800/60 bg-current opacity-20"></div>
					</div>
				{/if}

				{#if authenticated && user}
					<NavUserDropdown
						{user}
						isOpen={isDropdownOpen}
						themeLabel={t('nav.theme')}
						logoutLabel={t('dashboard.logout')}
						settingsLabel={t('settings.settingsLink')}
						locales={[...locale.locales]}
						currentLocale={locale.current}
						ontoggle={() => isDropdownOpen = !isDropdownOpen}
						onthemetoggle={handleThemeToggle}
						onlocalechange={handleLocaleChange}
						onlogout={handleLogout}
					/>
				{:else if !session.isLoading}
					<div class="hidden items-center gap-4 md:flex">
						<a
							href="/login"
							class="text-[10px] font-semibold uppercase tracking-widest transition-colors {isLanding ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
						>
							{t('nav.login')}
						</a>
						<a
							href="/signup"
							class="rounded-full border px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all {isLanding ? 'border-zinc-600 text-white hover:bg-white hover:text-black' : 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-gray-50 dark:border-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-200 dark:hover:text-neutral-900'}"
						>
							{t('nav.join')}
						</a>
					</div>
				{/if}

				<Button
					variant="icon"
					size="sm"
					onclick={() => (isMenuOpen = !isMenuOpen)}
					class="md:hidden"
					aria-label={isMenuOpen ? t('nav.close') : t('nav.menu')}
				>
					{#if isMenuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
				</Button>
			</div>
		</div>

		{#if isMenuOpen}
			<NavMobileMenu
				authenticated={authenticated ?? false}
				user={user as { name?: string | null; email: string } | undefined}
				{navLinks}
				{isAdmin}
				{t}
				locales={[...locale.locales]}
				currentLocale={locale.current}
				onclose={() => isMenuOpen = false}
				onthemetoggle={handleThemeToggle}
				onlocalechange={handleLocaleChange}
				onlogout={handleLogout}
			/>
		{/if}
	</nav>
{/if}
