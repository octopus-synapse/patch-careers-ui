<script lang="ts">
import { Briefcase, LayoutGrid, MessageCircle, Shield, UserCircle } from 'lucide-svelte';
import { Avatar, Button, SegmentToggle } from 'ui';
import type { AppContext } from '$lib/state/active-context.svelte';
import { chatState } from '$lib/state/chat-state.svelte';
import { colorSchema } from '$lib/state/color-schema.svelte';
import type { NavLink } from './nav-links-by-context';

type User = {
  name?: string | null;
  email: string;
};

type Props = {
  authenticated: boolean;
  user: User | undefined;
  navLinks: NavLink[];
  t: (key: string) => string;
  locales: string[];
  currentLocale: string;
  activeContext: AppContext;
  allowedContexts: AppContext[];
  onclose: () => void;
  onthemetoggle: (value: string) => void;
  onlocalechange: (value: string) => void;
  oncontextchange: (value: AppContext) => void;
  onlogout: () => void;
};

let {
  authenticated,
  user,
  navLinks,
  t,
  locales,
  currentLocale,
  activeContext,
  allowedContexts,
  onclose,
  onthemetoggle,
  onlocalechange,
  oncontextchange,
  onlogout,
}: Props = $props();

const cs = $derived(colorSchema.mode);
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

function handleContext(ctx: AppContext) {
  oncontextchange(ctx);
  onclose();
}
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
					{link.label}
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

				{#if canSwitchContext}
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
							<LayoutGrid size={14} />
							<span class="text-xs font-medium">{t('nav.context.label')}</span>
						</div>
						<div class="flex flex-col gap-1">
							{#each allowedContexts as ctx}
								{@const Icon = contextIcon(ctx)}
								{@const active = activeContext === ctx}
								<button
									onclick={() => handleContext(ctx)}
									aria-pressed={active}
									class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
										{active
											? 'bg-gray-200/60 dark:bg-neutral-700/60 text-gray-900 dark:text-neutral-100'
											: 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700/30'}"
								>
									<Icon size={16} />
									<span>{t(`nav.context.${ctx}`)}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

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
