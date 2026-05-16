<script lang="ts">
import {
  Briefcase,
  ChevronDown,
  FileText,
  Globe,
  LayoutGrid,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  UserCircle,
} from 'lucide-svelte';
import { Avatar, Button, SegmentToggle } from 'ui';
import type { AppContext } from '$lib/state/active-context.svelte';
import { colorSchema } from '$lib/state/color-schema.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

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
  activeContext: AppContext;
  allowedContexts: AppContext[];
  ontoggle: () => void;
  onthemetoggle: (value: string) => void;
  onlocalechange: (value: string) => void;
  oncontextchange: (value: AppContext) => void;
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
  activeContext,
  allowedContexts,
  ontoggle,
  onthemetoggle,
  onlocalechange,
  oncontextchange,
  onlogout,
}: Props = $props();

const cs = $derived(colorSchema.mode);
const displayName = $derived(user.name ?? user.email.split('@')[0]);
const initial = $derived(user.name ?? user.email);
const canSwitchContext = $derived(allowedContexts.length > 1);
const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const localeOptions = $derived(
  locales.map((l) => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })),
);

function contextIcon(ctx: AppContext) {
  if (ctx === 'candidate') return UserCircle;
  if (ctx === 'recruiter') return Briefcase;
  return Shield;
}
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

			{#if canSwitchContext}
				<div class="border-t border-gray-200/60 dark:border-neutral-800/60">
					<div class="px-4 py-3">
						<div class="mb-2 flex items-center gap-2 text-gray-500 dark:text-neutral-500">
							<LayoutGrid size={13} />
							<span class="text-xs font-medium">{t('nav.context.label')}</span>
						</div>
						<div class="flex flex-col gap-0.5">
							{#each allowedContexts as ctx}
								{@const Icon = contextIcon(ctx)}
								{@const active = activeContext === ctx}
								<button
									onclick={() => oncontextchange(ctx)}
									aria-pressed={active}
									class="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] transition-colors
										{active
											? 'bg-gray-100 dark:bg-neutral-700/60 text-gray-800 dark:text-neutral-200'
											: 'text-gray-500 dark:text-neutral-500 hover:bg-gray-50 dark:hover:bg-neutral-700/30'}"
								>
									<Icon size={13} />
									<span>{t(`nav.context.${ctx}`)}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<div class="border-t border-gray-200/60 dark:border-neutral-800/60">
				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
							<Sun size={13} class="hidden dark:block" />
							<Moon size={13} class="block dark:hidden" />
							<span class="text-xs font-medium">{themeLabel}</span>
						</div>
						<SegmentToggle options={themeOptions} selected={cs} onchange={onthemetoggle} />
					</div>
				</div>

				<div class="px-4 py-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
							<Globe size={13} />
							<span class="text-xs font-medium">Language</span>
						</div>
						<SegmentToggle options={localeOptions} selected={currentLocale} onchange={onlocalechange} />
					</div>
				</div>
			</div>

			<div class="border-t border-gray-200/60 dark:border-neutral-800/60">
				<a
					href="/careers/manage-resumes"
					data-sveltekit-preload-data="hover"
					class="flex w-full items-center gap-2 px-4 py-3 text-[11px] transition-opacity hover:opacity-70 text-gray-500 dark:text-neutral-500"
				>
					<FileText size={13} />
					{cvLabel ?? t('layout.myCvFallback')}
				</a>
				<a
					href="/my-profile/settings"
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
