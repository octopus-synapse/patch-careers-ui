<script lang="ts">
	import { Avatar, SegmentToggle } from 'ui';
	import { colorSchema } from '$lib/color-schema.svelte';
	import type { ComponentType } from 'svelte';
	import { MessageCircle, Shield } from 'lucide-svelte';
	import { chatState } from '$lib/chat-state.svelte';

	type User = {
		name?: string | null;
		email: string;
	};

	type NavLink = {
		key: string;
		href: string;
		icon: ComponentType;
	};

	type Props = {
		authenticated: boolean;
		user: User | undefined;
		navLinks: NavLink[];
		isAdmin: boolean;
		t: (key: string) => string;
		locales: string[];
		currentLocale: string;
		onclose: () => void;
		onthemetoggle: (value: string) => void;
		onlocalechange: (value: string) => void;
		onlogout: () => void;
	};

	let { authenticated, user, navLinks, isAdmin, t, locales, currentLocale, onclose, onthemetoggle, onlocalechange, onlogout }: Props = $props();

	const cs = $derived(colorSchema.mode);
	const themeOptions = [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];
	const localeOptions = $derived(locales.map(l => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })));
</script>

<div class="fixed inset-0 top-[57px] z-40 p-8 md:hidden bg-gray-50 dark:bg-neutral-900">
	<div class="flex h-full flex-col justify-between">
		<div class="flex flex-col gap-8 pt-4">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={onclose}
					class="flex items-center gap-4 text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
				>
					<link.icon size={24} class="text-gray-500 dark:text-neutral-500" />
					{t(link.key)}
				</a>
			{/each}

			{#if authenticated}
				<button
					onclick={() => { chatState.toggle(); onclose(); }}
					class="flex items-center gap-4 text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
				>
					<MessageCircle size={24} class="text-gray-500 dark:text-neutral-500" />
					{t('nav.messages')}
				</button>
			{/if}

			{#if isAdmin}
				<a
					href="/admin"
					onclick={onclose}
					class="flex items-center gap-4 text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
				>
					<Shield size={24} class="text-gray-500 dark:text-neutral-500" />
					Admin
				</a>
			{/if}
		</div>

		<div class="flex flex-col gap-5 pb-8">
			{#if authenticated && user}
				<div class="flex items-center gap-3 border-t pt-6 border-gray-200/60 dark:border-neutral-800/60">
					<Avatar name={user.name ?? user.email} size="md" />
					<div>
						<p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{user.name ?? user.email.split('@')[0]}</p>
						<p class="text-xs text-gray-500 dark:text-neutral-500">{user.email}</p>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('nav.theme')}</span>
					<SegmentToggle options={themeOptions} selected={cs} size="md" onchange={onthemetoggle} />
				</div>

				<div class="flex items-center justify-between">
					<span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Language</span>
					<SegmentToggle options={localeOptions} selected={currentLocale} size="md" onchange={onlocalechange} />
				</div>

				<button
					onclick={onlogout}
					class="mt-2 w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest text-red-500 transition-transform active:scale-[0.98]"
				>
					{t('dashboard.logout')}
				</button>
			{:else}
				<div class="flex items-center justify-between border-t pt-6 border-gray-200/60 dark:border-neutral-800/60">
					<span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('nav.theme')}</span>
					<SegmentToggle options={themeOptions} selected={cs} size="md" onchange={onthemetoggle} />
				</div>

				<a
					href="/signup"
					onclick={onclose}
					class="w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] bg-gray-800 text-gray-50 dark:bg-neutral-200 dark:text-neutral-900"
				>
					{t('nav.getStarted')}
				</a>
			{/if}
		</div>
	</div>
</div>
