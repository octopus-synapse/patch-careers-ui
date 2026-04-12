<script lang="ts">
	import { Avatar, SegmentToggle } from 'ui';
	import type { ColorSchema } from 'ui';
	import type { Locale } from 'i18n';

	type User = {
		name?: string | null;
		email: string;
	};

	type NavLink = {
		key: string;
		href: string;
	};

	type Props = {
		cs: ColorSchema;
		authenticated: boolean;
		user: User | undefined;
		navLinks: NavLink[];
		styles: Record<string, Record<string, string>>;
		t: (key: string) => string;
		locales: string[];
		currentLocale: string;
		onclose: () => void;
		onthemetoggle: (value: string) => void;
		onlocalechange: (value: string) => void;
		onlogout: () => void;
	};

	let { cs, authenticated, user, navLinks, styles: s, t, locales, currentLocale, onclose, onthemetoggle, onlocalechange, onlogout }: Props = $props();

	const themeOptions = [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];
	const localeOptions = $derived(locales.map(l => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })));
</script>

<div class="fixed inset-0 top-[57px] z-40 p-8 md:hidden {s.mobileBg[cs]}">
	<div class="flex h-full flex-col justify-between">
		<div class="flex flex-col gap-8 pt-4">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={onclose}
					class="text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 {s.text[cs]}"
				>
					{t(link.key)}
				</a>
			{/each}
		</div>

		<div class="flex flex-col gap-5 pb-8">
			{#if authenticated && user}
				<div class="flex items-center gap-3 border-t pt-6 {s.border[cs]}">
					<Avatar name={user.name ?? user.email} colorSchema={cs} size="md" />
					<div>
						<p class="text-sm font-semibold {s.text[cs]}">{user.name ?? user.email.split('@')[0]}</p>
						<p class="text-xs {s.muted[cs]}">{user.email}</p>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">{t('nav.theme')}</span>
					<SegmentToggle options={themeOptions} selected={cs} colorSchema={cs} size="md" onchange={onthemetoggle} />
				</div>

				<div class="flex items-center justify-between">
					<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">Language</span>
					<SegmentToggle options={localeOptions} selected={currentLocale} colorSchema={cs} size="md" onchange={onlocalechange} />
				</div>

				<button
					onclick={onlogout}
					class="mt-2 w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest text-red-500 transition-transform active:scale-[0.98]"
				>
					{t('dashboard.logout')}
				</button>
			{:else}
				<div class="flex items-center justify-between border-t pt-6 {s.border[cs]}">
					<span class="text-[10px] font-semibold uppercase tracking-widest {s.muted[cs]}">{t('nav.theme')}</span>
					<SegmentToggle options={themeOptions} selected={cs} colorSchema={cs} size="md" onchange={onthemetoggle} />
				</div>

				<a
					href="/signup"
					onclick={onclose}
					class="w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] {s.cta[cs]}"
				>
					{t('nav.getStarted')}
				</a>
			{/if}
		</div>
	</div>
</div>
