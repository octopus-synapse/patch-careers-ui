<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { createAuthSession, createAuthLogout, getAuthSessionQueryKey } from 'api-client';
	import type { Locale } from 'i18n';
	import { Menu, X, Sun, Moon, Globe, LogOut, ChevronDown } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { useQueryClient } from '@tanstack/svelte-query';

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

	function closeMenu() {
		isMenuOpen = false;
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

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
				{#if authenticated && user}
					<div class="relative hidden md:block" data-dropdown>
						<button
							onclick={toggleDropdown}
							class="flex items-center gap-2 p-1"
						>
							<div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold {s.cta[cs]}">
								{(user.name ?? user.email).charAt(0).toUpperCase()}
							</div>
							<ChevronDown size={14} class="transition-transform duration-200 {s.muted[cs]} {isDropdownOpen ? 'rotate-180' : ''}" />
						</button>

						{#if isDropdownOpen}
							<div class="absolute right-0 mt-3 w-56 rounded-lg {s.dropdownBg[cs]}">
								<div class="px-4 pt-4 pb-3">
									<p class="text-sm font-semibold {s.text[cs]}">{user.name ?? user.email.split('@')[0]}</p>
									<p class="text-[11px] {s.muted[cs]}">{user.email}</p>
								</div>

								<div class="border-t {s.border[cs]}">
									<div class="px-4 py-3">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2 {s.muted[cs]}">
												{#if cs === 'dark'}<Sun size={13} />{:else}<Moon size={13} />{/if}
												<span class="text-[10px] font-semibold uppercase tracking-widest">{t('nav.theme')}</span>
											</div>
											<div class="flex rounded-md {s.segmentBg[cs]} p-0.5">
												<button
													onclick={() => { if (cs === 'dark') colorSchema.toggle(); }}
													class="rounded px-2 py-0.5 text-[10px] font-semibold transition-all {cs === 'light' ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
												>Light</button>
												<button
													onclick={() => { if (cs === 'light') colorSchema.toggle(); }}
													class="rounded px-2 py-0.5 text-[10px] font-semibold transition-all {cs === 'dark' ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
												>Dark</button>
											</div>
										</div>
									</div>

									<div class="px-4 py-3">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2 {s.muted[cs]}">
												<Globe size={13} />
												<span class="text-[10px] font-semibold uppercase tracking-widest">Language</span>
											</div>
											<div class="flex rounded-md {s.segmentBg[cs]} p-0.5">
												{#each locale.locales as loc}
													<button
														onclick={() => locale.set(loc as Locale)}
														class="rounded px-2 py-0.5 text-[10px] font-semibold transition-all {locale.current === loc ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
													>{loc === 'pt-BR' ? 'PT' : 'EN'}</button>
												{/each}
											</div>
										</div>
									</div>
								</div>

								<div class="border-t {s.border[cs]}">
									<button
										onclick={() => logout.mutate({ data: {} })}
										class="flex w-full items-center gap-2 px-4 py-3 text-[11px] text-red-500 transition-opacity hover:opacity-70"
									>
										<LogOut size={13} />
										{t('dashboard.logout')}
									</button>
								</div>
							</div>
						{/if}
					</div>
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

					<div class="flex flex-col gap-5 pb-8">
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

							<div class="flex items-center justify-between">
								<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">{t('nav.theme')}</span>
								<div class="flex rounded-md {s.segmentBg[cs]} p-0.5">
									<button
										onclick={() => { if (cs === 'dark') colorSchema.toggle(); }}
										class="rounded px-3 py-1 text-xs font-semibold transition-all {cs === 'light' ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
									>Light</button>
									<button
										onclick={() => { if (cs === 'light') colorSchema.toggle(); }}
										class="rounded px-3 py-1 text-xs font-semibold transition-all {cs === 'dark' ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
									>Dark</button>
								</div>
							</div>

							<div class="flex items-center justify-between">
								<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">Language</span>
								<div class="flex rounded-md {s.segmentBg[cs]} p-0.5">
									{#each locale.locales as loc}
										<button
											onclick={() => locale.set(loc as Locale)}
											class="rounded px-3 py-1 text-xs font-semibold transition-all {locale.current === loc ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
										>{loc === 'pt-BR' ? 'PT' : 'EN'}</button>
									{/each}
								</div>
							</div>

							<button
								onclick={() => logout.mutate({ data: {} })}
								class="mt-2 w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest text-red-500 transition-transform active:scale-[0.98]"
							>
								{t('dashboard.logout')}
							</button>
						{:else}
							<div class="flex items-center justify-between border-t pt-6 {s.border[cs]}">
								<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">{t('nav.theme')}</span>
								<div class="flex rounded-md {s.segmentBg[cs]} p-0.5">
									<button
										onclick={() => { if (cs === 'dark') colorSchema.toggle(); }}
										class="rounded px-3 py-1 text-xs font-semibold transition-all {cs === 'light' ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
									>Light</button>
									<button
										onclick={() => { if (cs === 'light') colorSchema.toggle(); }}
										class="rounded px-3 py-1 text-xs font-semibold transition-all {cs === 'dark' ? s.segmentActive[cs] + ' ' + s.text[cs] : s.muted[cs]}"
									>Dark</button>
								</div>
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
