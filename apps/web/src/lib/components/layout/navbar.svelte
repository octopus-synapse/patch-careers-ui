<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createLogout, sessionQueryKey } from 'api-client';
import type { Locale } from 'i18n';
import {
  ChevronDown,
  Menu,
  Search,
  X,
} from 'lucide-svelte';
import { Button } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { useActiveContext, type AppContext } from '$lib/state/active-context.svelte';
import { colorSchema } from '$lib/state/color-schema.svelte';
import { locale } from '$lib/state/locale.svelte';
import NavLogo from './nav-logo.svelte';
import NavMobileMenu from './nav-mobile-menu.svelte';
import CommandPalette from '../command-palette/command-palette.svelte';
import NavUserDropdown from './nav-user-dropdown.svelte';
import NotificationBell from './notification-bell.svelte';
import { getNavLinks, homeOf, pathContext } from './nav-links-by-context';
import { useAuth } from '$lib/state/auth.svelte';
import { useFeatureFlags } from '$lib/state/feature-flags.svelte';
import { clearForUser } from '$lib/utils/secure-storage.svelte';

const pathname = $derived($page.url.pathname);
const isLanding = $derived(pathname === '/');

const cs = $derived(colorSchema.mode);
const t = $derived(locale.t);

let isMenuOpen = $state(false);
let isDropdownOpen = $state(false);
let isMoreOpen = $state(false);
let isSearchOpen = $state(false);

const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/i.test(navigator.platform));

const session = useAuth();
const user = $derived(session.user);
const authenticated = $derived(session.isAuthenticated);
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

const activeContext = useActiveContext(() => ({
  isAdmin: Boolean(user?.isAdmin),
  isLoading: session.isLoading,
}));

function isActiveRoute(href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

const queryClient = useQueryClient();
const logout = createLogout({
  mutation: {
    async onSuccess() {
      clearForUser(user?.id);
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
      await queryClient.refetchQueries({ queryKey: sessionQueryKey() });
      isDropdownOpen = false;
      goto('/identity/sign-in', { replaceState: true, invalidateAll: true });
    },
    onError() {
      clearForUser(user?.id);
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

function handleMoreOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-more]')) {
    isMoreOpen = false;
  }
}

$effect(() => {
  if (isDropdownOpen) {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }
});

$effect(() => {
  if (isMoreOpen) {
    document.addEventListener('click', handleMoreOutside);
    return () => document.removeEventListener('click', handleMoreOutside);
  }
});

// Reconcile active context to the URL: if the user landed on an
// admin/recruiting route via deep link, switch context silently (without
// navigating) so the navbar reflects where they actually are.
$effect(() => {
  const desired = pathContext(pathname);
  if (!desired) return;
  if (activeContext.current === desired) return;
  if (!activeContext.allowedContexts.includes(desired)) return;
  activeContext.setContext(desired);
});

function handleThemeToggle(value: string) {
  if (value !== cs) colorSchema.toggle();
}

function handleLocaleChange(value: string) {
  locale.set(value as Locale);
}

function handleContextChange(ctx: AppContext) {
  activeContext.setContext(ctx);
  isDropdownOpen = false;
  isMoreOpen = false;
  if (browser) goto(homeOf(ctx));
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
  if (e.key === 'Escape' && isMoreOpen) {
    isMoreOpen = false;
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

const flags = useFeatureFlags(() => ({ authenticated: Boolean(authenticated) }));
const navLinks = $derived(
  getNavLinks(activeContext.current, {
    t,
    homeLabel,
    flagsEnabled: (k) => flags.enabled(k),
  }),
);
const isAdminContext = $derived(activeContext.current === 'admin');
const primaryLinks = $derived(
  isAdminContext ? navLinks.filter((l) => l.primary === true) : navLinks,
);
const overflowLinks = $derived(
  isAdminContext ? navLinks.filter((l) => l.primary !== true) : [],
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
						{#each primaryLinks as link}
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

						{#if overflowLinks.length > 0}
							{@const overflowActive = overflowLinks.some((l) => isActiveRoute(l.href))}
							<div class="relative" data-more>
								<button
									onclick={() => (isMoreOpen = !isMoreOpen)}
									aria-haspopup="true"
									aria-expanded={isMoreOpen}
									aria-current={overflowActive ? 'page' : undefined}
									class="relative flex min-w-[4rem] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors
										{overflowActive
											? 'text-gray-900 dark:text-neutral-100'
											: 'text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
								>
									<ChevronDown size={20} class="transition-transform duration-200 {isMoreOpen ? 'rotate-180' : ''}" />
									<span>{t('nav.more')}</span>
									{#if overflowActive}
										<span class="absolute inset-x-3 -bottom-px h-px bg-current"></span>
									{/if}
								</button>

								{#if isMoreOpen}
									<div class="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg dark:bg-neutral-800 border-gray-200/60 dark:border-neutral-700/60">
										<div class="flex flex-col py-1">
											{#each overflowLinks as link}
												{@const linkActive = isActiveRoute(link.href)}
												<a
													href={link.href}
													data-sveltekit-preload-data="hover"
													onclick={() => (isMoreOpen = false)}
													aria-current={linkActive ? 'page' : undefined}
													class="flex items-center gap-2 px-4 py-2 text-xs transition-colors
														{linkActive
															? 'bg-gray-100 dark:bg-neutral-700/60 text-gray-900 dark:text-neutral-100'
															: 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700/30'}"
												>
													<link.icon size={14} />
													<span>{link.label}</span>
												</a>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}

						{#if authenticated}
							<NotificationBell />
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
						activeContext={activeContext.current}
						allowedContexts={activeContext.allowedContexts}
						ontoggle={() => isDropdownOpen = !isDropdownOpen}
						onthemetoggle={handleThemeToggle}
						onlocalechange={handleLocaleChange}
						oncontextchange={handleContextChange}
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
				{t}
				locales={[...locale.locales]}
				currentLocale={locale.current}
				activeContext={activeContext.current}
				allowedContexts={activeContext.allowedContexts}
				onclose={() => isMenuOpen = false}
				onthemetoggle={handleThemeToggle}
				onlocalechange={handleLocaleChange}
				oncontextchange={handleContextChange}
				onlogout={handleLogout}
			/>
		{/if}
	</nav>
{/if}
