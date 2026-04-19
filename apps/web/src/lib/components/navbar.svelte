<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createAuthLogout,
  createAuthSession,
  createChatGetUnreadCount,
  getAuthSessionQueryKey,
} from 'api-client';
import type { Locale } from 'i18n';
import {
  Briefcase,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Rss,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-svelte';
import { Button } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { chatState } from '$lib/chat-state.svelte';
import { colorSchema } from '$lib/color-schema.svelte';
import { locale } from '$lib/locale.svelte';
import NavLogo from './nav-logo.svelte';
import NavMobileMenu from './nav-mobile-menu.svelte';
import NavSearchModal from './nav-search-modal.svelte';
import NavUserDropdown from './nav-user-dropdown.svelte';
import NotificationBell from './notification-bell.svelte';

const pathname = $derived($page.url.pathname);
const isLanding = $derived(pathname === '/');

const cs = $derived(colorSchema.mode);
const t = $derived(locale.t);

let isMenuOpen = $state(false);
let isDropdownOpen = $state(false);
let isSearchOpen = $state(false);

const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/i.test(navigator.platform));

const session = createAuthSession(() => ({
  query: { retry: false, enabled: browser },
}));
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
const hasCompletedOnboarding = $derived(user?.hasCompletedOnboarding);
const isAdmin = $derived(Boolean(user?.isAdmin));

const unreadChatQuery = createChatGetUnreadCount(() => ({
  query: { enabled: browser && Boolean(authenticated), refetchInterval: 30000 },
}));
const unreadChatCount = $derived(unreadChatQuery.data?.count ?? 0);

function isActiveRoute(href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

const queryClient = useQueryClient();
const logout = createAuthLogout(() => ({
  mutation: {
    async onSuccess() {
      // Clear *all* cached queries so the next screen can't flash user
      // data from the previously authenticated session.
      queryClient.clear();
      // Re-query session explicitly and await so the SSR/CSR guards
      // see `authenticated: false` before we navigate.
      await queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
      await queryClient.refetchQueries({ queryKey: getAuthSessionQueryKey() });
      isDropdownOpen = false;
      goto('/login', { replaceState: true, invalidateAll: true });
    },
    onError() {
      // Even if the server logout fails (e.g., network), scrub local
      // cache and send the user to /login — the server session may
      // have already been invalidated on a different device.
      queryClient.clear();
      isDropdownOpen = false;
      goto('/login', { replaceState: true });
    },
  },
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

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    isSearchOpen = !isSearchOpen;
    return;
  }
  if (e.key === 'Escape' && isDropdownOpen) {
    isDropdownOpen = false;
    return;
  }
  if (
    e.key === '/' &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !isSearchOpen &&
    hasCompletedOnboarding &&
    !isTypingTarget(e.target)
  ) {
    e.preventDefault();
    isSearchOpen = true;
  }
}

const navLinks = [
  { key: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.feed', href: '/feed', icon: Rss },
  { key: 'nav.jobs', href: '/jobs', icon: Briefcase },
  { key: 'nav.myNetwork', href: '/mynetwork', icon: Users },
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
						<kbd class="rounded border px-1.5 py-0.5 text-[10px] font-medium bg-gray-100/80 dark:bg-neutral-800/80 text-gray-400 dark:text-neutral-500 border-gray-200/60 dark:border-neutral-700/60">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
					</button>
				</div>
			{:else}
				<div class="flex-1"></div>
			{/if}

			<div class="flex shrink-0 items-center gap-1">
				{#if hasCompletedOnboarding}
					<div class="hidden items-center gap-1 md:flex">
						{#each navLinks as link}
							{@const active = isActiveRoute(link.href)}
							<a
								href={link.href}
								data-sveltekit-preload-data="hover"
								aria-current={active ? 'page' : undefined}
								class="relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors
									{active
										? 'text-gray-900 dark:text-neutral-100'
										: 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
							>
								<link.icon size={14} />
								{t(link.key)}
								{#if active}
									<span class="absolute inset-x-3 -bottom-px h-px bg-current"></span>
								{/if}
							</a>
						{/each}

						{#if authenticated}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => chatState.toggle()}
								data-testid="chat-toggle"
								class="relative"
							>
								<MessageCircle size={14} />
								{t('nav.messages')}
								{#if unreadChatCount > 0}
									<span class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
										{unreadChatCount > 99 ? '99+' : unreadChatCount}
									</span>
								{/if}
							</Button>

							<NotificationBell />
						{/if}

						{#if isAdmin}
							{@const adminActive = isActiveRoute('/admin')}
							<a
								href="/admin"
								data-sveltekit-preload-data="hover"
								aria-current={adminActive ? 'page' : undefined}
								class="relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors
									{adminActive
										? 'text-gray-900 dark:text-neutral-100'
										: 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
							>
								<Shield size={14} />
								Admin
								{#if adminActive}
									<span class="absolute inset-x-3 -bottom-px h-px bg-current"></span>
								{/if}
							</a>
						{/if}

						<div class="mx-2 h-4 w-px bg-gray-200 dark:bg-neutral-800"></div>
					</div>
				{/if}

				{#if authenticated && user}
					<NavUserDropdown
						{user}
						isOpen={isDropdownOpen}
						themeLabel={t('nav.theme')}
						logoutLabel={t('dashboard.logout')}
						settingsLabel={t('settings.settingsLink')}
						cvLabel={t('cv.pageTitle')}
						locales={[...locale.locales]}
						currentLocale={locale.current}
						ontoggle={() => isDropdownOpen = !isDropdownOpen}
						onthemetoggle={handleThemeToggle}
						onlocalechange={handleLocaleChange}
						onlogout={handleLogout}
					/>
				{:else if session.isLoading}
					<div class="hidden h-8 w-[180px] md:block" aria-hidden="true"></div>
				{:else}
					<div class="hidden items-center gap-4 md:flex">
						<a
							href="/login"
							data-sveltekit-preload-data="hover"
							class="text-[10px] font-semibold uppercase tracking-widest transition-colors {isLanding ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
						>
							{t('nav.login')}
						</a>
						<a
							href="/signup"
							data-sveltekit-preload-data="hover"
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
					data-testid="menu-toggle"
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
