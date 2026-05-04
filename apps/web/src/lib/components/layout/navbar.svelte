<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createAuthLogout, authSessionQueryKey } from 'api-client';
import type { Locale } from 'i18n';
import {
  Briefcase,
  LayoutDashboard,
  Menu,
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
import { colorSchema } from '$lib/state/color-schema.svelte';
import { locale } from '$lib/state/locale.svelte';
import NavLogo from './nav-logo.svelte';
import NavMobileMenu from './nav-mobile-menu.svelte';
import CommandPalette from '../command-palette/command-palette.svelte';
import NavUserDropdown from './nav-user-dropdown.svelte';
import NotificationBell from './notification-bell.svelte';
import {
  ADMIN_NAV_LINKS,
  isAdminPath,
} from '../../../routes/[[lang=lang]]/platform/admin/_components/admin-nav-links';
import { useAuth } from '$lib/state/auth.svelte';
import { useFeatureFlags } from '$lib/state/feature-flags.svelte';

const pathname = $derived($page.url.pathname);
const isLanding = $derived(pathname === '/');

const cs = $derived(colorSchema.mode);
const t = $derived(locale.t);

let isMenuOpen = $state(false);
let isDropdownOpen = $state(false);
let isSearchOpen = $state(false);

const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/i.test(navigator.platform));

const session = useAuth();
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);
// Admins bypass onboarding entirely, so `hasCompletedOnboarding` stays
// false for them — `!needsOnboarding` is the flag that's true for both
// admins and regular users past the wizard. `!needsEmailVerification`
// keeps items hidden during the verify-email stage (otherwise a user
// who's bypassed onboarding via admin role but hasn't verified email
// would still see every item).
const canUseApp = $derived(
  Boolean(authenticated) &&
    !(user?.needsEmailVerification ?? false) &&
    !(user?.needsOnboarding ?? false),
);
const isAdmin = $derived(Boolean(user?.isAdmin));

function isActiveRoute(href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

const queryClient = useQueryClient();
const logout = createAuthLogout({
  mutation: {
    async onSuccess() {
      // Clear *all* cached queries so the next screen can't flash user
      // data from the previously authenticated session.
      queryClient.clear();
      // Re-query session explicitly and await so the SSR/CSR guards
      // see `authenticated: false` before we navigate.
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey() });
      await queryClient.refetchQueries({ queryKey: authSessionQueryKey() });
      isDropdownOpen = false;
      goto('/identity/sign-in', { replaceState: true, invalidateAll: true });
    },
    onError() {
      // Even if the server logout fails (e.g., network), scrub local
      // cache and send the user to /login — the server session may
      // have already been invalidated on a different device.
      queryClient.clear();
      isDropdownOpen = false;
      goto('/identity/sign-in', { replaceState: true });
    },
  },
});

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
  $logout.mutate({ data: {} });
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
    canUseApp &&
    !isTypingTarget(e.target)
  ) {
    e.preventDefault();
    isSearchOpen = true;
  }
}

const firstName = $derived.by(() => {
  const raw = (user?.name ?? '').toString().trim();
  if (!raw) return '';
  return raw.split(/\s+/)[0] ?? '';
});

const homeLabel = $derived(firstName ? `Olá, ${firstName}` : t('nav.dashboard'));

// Each link may declare a feature-flag key. When the flag is OFF (or its
// parents cascade off), the link is hidden. Dashboard has no flagKey so
// it's always reachable.
const flags = useFeatureFlags(() => ({ authenticated: Boolean(authenticated) }));
const allNavLinks = $derived([
  { key: 'nav.dashboard', label: homeLabel, href: '/my-profile/dashboard', icon: LayoutDashboard, flagKey: undefined as string | undefined },
  { key: 'nav.feed', label: t('nav.feed'), href: '/social/feed', icon: Rss, flagKey: 'social.feed' },
  { key: 'nav.jobs', label: t('nav.jobs'), href: '/careers/browse-jobs', icon: Briefcase, flagKey: 'jobs' },
  { key: 'nav.myNetwork', label: t('nav.myNetwork'), href: '/social/network', icon: Users, flagKey: 'social.network' },
]);
const navLinks = $derived(
  allNavLinks.filter((l) => !l.flagKey || flags.enabled(l.flagKey)),
);

// Rotating placeholder hints for the global search box.
let searchHintIdx = $state(0);
const searchHints = $derived([
  t('nav.search'),
  t('nav.searchHintPeople'),
  t('nav.searchHintJobs'),
  t('nav.searchHintRemote'),
]);
$effect(() => {
  if (!browser) return;
  const id = setInterval(() => {
    searchHintIdx = (searchHintIdx + 1) % searchHints.length;
  }, 4000);
  return () => clearInterval(id);
});
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if t}
	<CommandPalette open={isSearchOpen} {t} onclose={() => isSearchOpen = false} />

	<nav class="fixed top-0 right-0 left-0 z-50 transition-colors duration-300
		{isLanding ? 'border-transparent' : 'border-b border-gray-200/60 dark:border-neutral-800/60'}
		{isLanding ? 'bg-transparent' : isMenuOpen ? 'bg-gray-50 dark:bg-neutral-900' : 'backdrop-blur-md bg-gray-50/80 dark:bg-neutral-900/80'}">
		<div class="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-6">
			<div class="flex shrink-0 items-center">
				<NavLogo textClass={isLanding ? 'text-white' : 'text-gray-800 dark:text-neutral-200'} />
			</div>

			{#if canUseApp}
				<div class="mx-auto hidden max-w-md flex-1 px-4 lg:px-8 md:block">
					<button
						onclick={() => isSearchOpen = true}
						title="{t('nav.search')} ({isMac ? '⌘K' : 'Ctrl + K'})"
						aria-label="{t('nav.search')}"
						class="flex w-full items-center gap-2 rounded-lg border py-1.5 pr-2 pl-3 transition-colors bg-gray-100/80 dark:bg-neutral-800/80 text-gray-500 dark:text-neutral-400 border-gray-200/60 dark:border-neutral-700/60 hover:border-gray-300 dark:hover:border-neutral-600"
					>
						<Search size={14} class="text-gray-500 dark:text-neutral-400" />
						<span class="flex-1 text-left text-xs">{searchHints[searchHintIdx] ?? t('nav.search')}</span>
						<kbd class="rounded border px-1.5 py-0.5 text-xs font-medium bg-white/60 dark:bg-neutral-900/40 text-gray-600 dark:text-neutral-300 border-gray-200/60 dark:border-neutral-700/60">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
					</button>
				</div>
			{:else}
				<div class="flex-1"></div>
			{/if}

			<div class="flex shrink-0 items-center gap-1">
				{#if canUseApp}
					<div class="hidden items-center gap-1 md:flex">
						{#each navLinks as link}
							{@const active = isActiveRoute(link.href)}
							<a
								href={link.href}
								data-sveltekit-preload-data="hover"
								aria-current={active ? 'page' : undefined}
								class="relative flex min-w-[4rem] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors
									{active
										? 'text-gray-900 dark:text-neutral-100'
										: 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
							>
								<link.icon size={20} />
								<span>{link.label}</span>
								{#if active}
									<span class="absolute inset-x-3 -bottom-px h-px bg-current"></span>
								{/if}
							</a>
						{/each}

						{#if authenticated}
							<NotificationBell />
						{/if}

						{#if authenticated}
							{@const companyActive = isActiveRoute('/recruiting')}
							<a
								href="/recruiting/jobs"
								data-sveltekit-preload-data="hover"
								aria-current={companyActive ? 'page' : undefined}
								class="relative flex min-w-[4rem] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors
									{companyActive
										? 'text-gray-900 dark:text-neutral-100'
										: 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
							>
								<Briefcase size={20} />
								<span>{t('company.nav')}</span>
								{#if companyActive}
									<span class="absolute inset-x-3 -bottom-px h-px bg-current"></span>
								{/if}
							</a>
						{/if}

						{#if isAdmin}
							{@const adminActive = isActiveRoute('/platform/admin')}
							<a
								href="/platform/admin"
								data-sveltekit-preload-data="hover"
								aria-current={adminActive ? 'page' : undefined}
								class="relative flex min-w-[4rem] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors
									{adminActive
										? 'text-gray-900 dark:text-neutral-100'
										: 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
							>
								<Shield size={20} />
								<span>Admin</span>
								{#if adminActive}
									<span class="absolute inset-x-3 -bottom-px h-px bg-current"></span>
								{/if}
							</a>
						{/if}

						<div class="mx-2 h-8 w-px bg-gray-200 dark:bg-neutral-800"></div>
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
							href="/identity/sign-in"
							data-sveltekit-preload-data="hover"
							class="text-xs font-medium transition-colors {isLanding ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
						>
							{t('nav.login')}
						</a>
						<a
							href="/identity/sign-up"
							data-sveltekit-preload-data="hover"
							class="rounded-full border px-5 py-1.5 text-xs font-medium transition-all {isLanding ? 'border-zinc-600 text-white hover:bg-white hover:text-black' : 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-gray-50 dark:border-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-200 dark:hover:text-neutral-900'}"
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
				adminLinks={ADMIN_NAV_LINKS}
				showAdminSection={isAdmin && isAdminPath(pathname)}
			/>
		{/if}
	</nav>
{/if}
