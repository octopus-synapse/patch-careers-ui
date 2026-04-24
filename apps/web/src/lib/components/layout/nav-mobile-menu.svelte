<script lang="ts">
import { MessageCircle, Shield } from 'lucide-svelte';
import type { ComponentType } from 'svelte';
import { Avatar, Button, SegmentToggle } from 'ui';
import { chatState } from '$lib/state/chat-state.svelte';
import { colorSchema } from '$lib/state/color-schema.svelte';

type User = {
  name?: string | null;
  email: string;
};

type NavLink = {
  key: string;
  href: string;
  icon: ComponentType;
};

type AdminNavLink = {
  href: string;
  labelKey: string;
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
  adminLinks?: AdminNavLink[];
  showAdminSection?: boolean;
};

let {
  authenticated,
  user,
  navLinks,
  isAdmin,
  t,
  locales,
  currentLocale,
  onclose,
  onthemetoggle,
  onlocalechange,
  onlogout,
  adminLinks,
  showAdminSection = false,
}: Props = $props();

const cs = $derived(colorSchema.mode);
const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const localeOptions = $derived(
  locales.map((l) => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })),
);
</script>

<div class="fixed inset-0 top-[57px] z-40 overflow-y-auto p-5 sm:p-8 md:hidden bg-gray-50 dark:bg-neutral-900">
	<div class="flex h-full flex-col justify-between">
		<div class="flex flex-col gap-6 sm:gap-8 pt-4">
			{#each navLinks as link}
				<a
					href={link.href}
					onclick={onclose}
					class="flex items-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
				>
					<link.icon size={24} class="text-gray-500 dark:text-neutral-500" />
					{t(link.key)}
				</a>
			{/each}

			{#if authenticated}
				<button
					onclick={() => { chatState.toggle(); onclose(); }}
					class="flex items-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
					data-testid="chat-toggle"
				>
					<MessageCircle size={24} class="text-gray-500 dark:text-neutral-500" />
					{t('nav.messages')}
				</button>
			{/if}

			{#if isAdmin && !showAdminSection}
				<a
					href="/platform/admin"
					onclick={onclose}
					class="flex items-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
				>
					<Shield size={24} class="text-gray-500 dark:text-neutral-500" />
					Admin
				</a>
			{/if}

			{#if showAdminSection && adminLinks && adminLinks.length > 0}
				<div class="flex flex-col gap-4 border-t pt-5 sm:gap-5 sm:pt-6 border-gray-200/60 dark:border-neutral-800/60">
					<div class="flex items-center gap-2">
						<Shield size={16} class="text-gray-500 dark:text-neutral-500" />
						<span class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
							Admin
						</span>
					</div>
					{#each adminLinks as link}
						<a
							href={link.href}
							onclick={onclose}
							class="flex items-center gap-3 sm:gap-4 text-xl sm:text-2xl font-medium tracking-tight transition-opacity hover:opacity-60 text-gray-800 dark:text-neutral-200"
						>
							<link.icon size={22} class="text-gray-500 dark:text-neutral-500" />
							{t(link.labelKey)}
						</a>
					{/each}
				</div>
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
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">{t('nav.theme')}</span>
					<SegmentToggle options={themeOptions} selected={cs} size="sm" onchange={onthemetoggle} />
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">Language</span>
					<SegmentToggle options={localeOptions} selected={currentLocale} size="sm" onchange={onlocalechange} />
				</div>

				<Button
					variant="ghost" intent="danger"
					size="lg"
					fullWidth
					onclick={onlogout}
					class="mt-2"
				>
					{t('dashboard.logout')}
				</Button>
			{:else}
				<div class="flex items-center justify-between border-t pt-6 border-gray-200/60 dark:border-neutral-800/60">
					<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">{t('nav.theme')}</span>
					<SegmentToggle options={themeOptions} selected={cs} size="sm" onchange={onthemetoggle} />
				</div>

				<a
					href="/identity/sign-up"
					onclick={onclose}
					class="w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] bg-gray-800 text-gray-50 dark:bg-neutral-200 dark:text-neutral-900"
				>
					{t('nav.getStarted')}
				</a>
			{/if}
		</div>
	</div>
</div>
