<script lang="ts">
import { ChevronDown, FileText, Globe, LogOut, Moon, Settings, Sun } from 'lucide-svelte';
import { Avatar, Button, SegmentToggle } from 'ui';
import { colorSchema } from '$lib/color-schema.svelte';

type User = {
  name?: string | null;
  username?: string | null;
  email: string;
};

type Props = {
  user: User;
  isOpen: boolean;
  themeLabel: string;
  logoutLabel: string;
  settingsLabel?: string;
  cvLabel?: string;
  locales: string[];
  currentLocale: string;
  ontoggle: () => void;
  onthemetoggle: (value: string) => void;
  onlocalechange: (value: string) => void;
  onlogout: () => void;
};

let {
  user,
  isOpen,
  themeLabel,
  logoutLabel,
  settingsLabel,
  cvLabel,
  locales,
  currentLocale,
  ontoggle,
  onthemetoggle,
  onlocalechange,
  onlogout,
}: Props = $props();

const cs = $derived(colorSchema.mode);
const displayName = $derived(user.name ?? user.email.split('@')[0]);
const initial = $derived(user.name ?? user.email);
const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const localeOptions = $derived(
  locales.map((l) => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })),
);
</script>

<div class="relative hidden md:block" data-dropdown>
	<Button variant="icon" size="sm" onclick={ontoggle}>
		<Avatar name={initial} size="sm" />
		<ChevronDown size={14} class="transition-transform duration-200 text-gray-500 dark:text-neutral-500 {isOpen ? 'rotate-180' : ''}" />
	</Button>

	{#if isOpen}
		<div class="absolute right-0 mt-3 w-56 rounded-lg bg-white dark:bg-neutral-800">
			<div class="px-4 pt-4 pb-3">
				<p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{displayName}</p>
				{#if user.username}
					<p class="text-[11px] text-gray-500 dark:text-neutral-500">@{user.username}</p>
				{/if}
				<p class="text-[10px] text-gray-500 dark:text-neutral-500">{user.email}</p>
			</div>

			<div class="border-t border-gray-200/60 dark:border-neutral-800/60">
				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
							<Sun size={13} class="hidden dark:block" />
							<Moon size={13} class="block dark:hidden" />
							<span class="text-[10px] font-semibold uppercase tracking-widest">{themeLabel}</span>
						</div>
						<SegmentToggle options={themeOptions} selected={cs} onchange={onthemetoggle} />
					</div>
				</div>

				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
							<Globe size={13} />
							<span class="text-[10px] font-semibold uppercase tracking-widest">Language</span>
						</div>
						<SegmentToggle options={localeOptions} selected={currentLocale} onchange={onlocalechange} />
					</div>
				</div>
			</div>

			<div class="border-t border-gray-200/60 dark:border-neutral-800/60">
				<a
					href="/cv"
					data-sveltekit-preload-data="hover"
					class="flex w-full items-center gap-2 px-4 py-3 text-[11px] transition-opacity hover:opacity-70 text-gray-500 dark:text-neutral-500"
				>
					<FileText size={13} />
					{cvLabel ?? 'My CV'}
				</a>
				<a
					href="/settings"
					class="flex w-full items-center gap-2 px-4 py-3 text-[11px] transition-opacity hover:opacity-70 text-gray-500 dark:text-neutral-500"
				>
					<Settings size={13} />
					{settingsLabel ?? 'Settings'}
				</a>
				<Button
					variant="ghost" intent="danger"
					size="sm"
					onclick={onlogout}
					class="w-full px-4 py-3 text-[11px]"
				>
					<LogOut size={13} />
					{logoutLabel}
				</Button>
			</div>
		</div>
	{/if}
</div>
