<script lang="ts">
	import { Avatar, SegmentToggle } from 'ui';
	import type { ColorSchema } from 'ui';
	import { Sun, Moon, Globe, LogOut, ChevronDown } from 'lucide-svelte';

	type User = {
		name?: string | null;
		username?: string | null;
		email: string;
	};

	type Props = {
		user: User;
		cs: ColorSchema;
		isOpen: boolean;
		styles: Record<string, Record<string, string>>;
		themeLabel: string;
		logoutLabel: string;
		locales: string[];
		currentLocale: string;
		ontoggle: () => void;
		onthemetoggle: (value: string) => void;
		onlocalechange: (value: string) => void;
		onlogout: () => void;
	};

	let { user, cs, isOpen, styles: s, themeLabel, logoutLabel, locales, currentLocale, ontoggle, onthemetoggle, onlocalechange, onlogout }: Props = $props();

	const displayName = $derived(user.name ?? user.email.split('@')[0]);
	const initial = $derived(user.name ?? user.email);
	const themeOptions = [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];
	const localeOptions = $derived(locales.map(l => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })));
</script>

<div class="relative hidden md:block" data-dropdown>
	<button onclick={ontoggle} class="flex items-center gap-2 p-1">
		<Avatar name={initial} colorSchema={cs} size="sm" />
		<ChevronDown size={14} class="transition-transform duration-200 {s.muted[cs]} {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<div class="absolute right-0 mt-3 w-56 rounded-lg {s.dropdownBg[cs]}">
			<div class="px-4 pt-4 pb-3">
				<p class="text-sm font-semibold {s.text[cs]}">{displayName}</p>
				{#if user.username}
					<p class="text-[11px] {s.muted[cs]}">@{user.username}</p>
				{/if}
				<p class="text-[10px] {s.muted[cs]}">{user.email}</p>
			</div>

			<div class="border-t {s.border[cs]}">
				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 {s.muted[cs]}">
							{#if cs === 'dark'}<Sun size={13} />{:else}<Moon size={13} />{/if}
							<span class="text-[10px] font-semibold uppercase tracking-widest">{themeLabel}</span>
						</div>
						<SegmentToggle options={themeOptions} selected={cs} colorSchema={cs} onchange={onthemetoggle} />
					</div>
				</div>

				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 {s.muted[cs]}">
							<Globe size={13} />
							<span class="text-[10px] font-semibold uppercase tracking-widest">Language</span>
						</div>
						<SegmentToggle options={localeOptions} selected={currentLocale} colorSchema={cs} onchange={onlocalechange} />
					</div>
				</div>
			</div>

			<div class="border-t {s.border[cs]}">
				<button
					onclick={onlogout}
					class="flex w-full items-center gap-2 px-4 py-3 text-[11px] text-red-500 transition-opacity hover:opacity-70"
				>
					<LogOut size={13} />
					{logoutLabel}
				</button>
			</div>
		</div>
	{/if}
</div>
