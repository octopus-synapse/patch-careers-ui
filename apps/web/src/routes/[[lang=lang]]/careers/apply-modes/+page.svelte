<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1UsersPreferencesFull,
  createPatchV1UsersPreferencesFull,
  getV1UsersPreferencesFullQueryKey,
} from 'api-client';
import type { PatchV1UsersPreferencesFullMutationRequestApplyModeEnumKey } from 'api-client';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  MousePointerClick,
  Sparkles,
  Zap,
} from 'lucide-svelte';
import { Badge, Button, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);

$effect(() => {
  if (!auth.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const queryClient = useQueryClient();

// svelte-ignore state_referenced_locally
const preferencesQuery = createGetV1UsersPreferencesFull({
  query: { enabled: browser && authenticated },
});

type ModeKey = PatchV1UsersPreferencesFullMutationRequestApplyModeEnumKey;

const currentMode = $derived<ModeKey>($preferencesQuery.data?.preferences.applyMode ?? 'ONE_CLICK');

const updateMutation = createPatchV1UsersPreferencesFull({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getV1UsersPreferencesFullQueryKey() });
    },
    onError() {
      toastState.show(t('careers.applyModes.toastUpdateFailed'), 'danger');
    },
  },
});

function setMode(mode: ModeKey) {
  $updateMutation.mutate({ data: { applyMode: mode } });
}

function notifyWhenReady() {
  toastState.show(t('applyModes.notifySuccess'), 'success');
}

const modes: Array<{
  key: ModeKey;
  labelKey: string;
  icon: typeof MousePointerClick;
  iconClass: string;
  tintClass: string;
  borderClass: string;
  available: boolean;
}> = [
  {
    key: 'ONE_CLICK',
    labelKey: 'oneClick',
    icon: MousePointerClick,
    iconClass: 'text-sky-500',
    tintClass: 'from-sky-500/10 to-blue-600/5',
    borderClass: 'border-sky-500/40',
    available: true,
  },
  {
    key: 'WEEKLY_CURATED',
    labelKey: 'curated',
    icon: CalendarCheck,
    iconClass: 'text-amber-500',
    tintClass: 'from-amber-500/10 to-orange-500/5',
    borderClass: 'border-amber-500/30',
    available: true,
  },
  {
    key: 'AUTO_APPLY',
    labelKey: 'autoApply',
    icon: Zap,
    iconClass: 'text-violet-500',
    tintClass: 'from-violet-500/10 to-purple-600/5',
    borderClass: 'border-violet-500/30',
    available: true,
  },
];
</script>

<svelte:head>
	<title>{t('applyModes.pageTitle')}</title>
</svelte:head>

{#if t && authenticated}
	<div class="min-h-screen pt-20 pb-16">
		<main class="mx-auto max-w-6xl px-4 sm:px-6">
			<header class="mb-10 text-center">
				<p class="mb-3 font-mono text-xs uppercase tracking-[0.4em] text-cyan-600 dark:text-cyan-400">
					<Sparkles size={10} class="mr-1 inline" />
					{t('applyModes.pageTitle')}
				</p>
				<h1 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100 sm:text-4xl">
					{t('applyModes.heroTitle')}
				</h1>
				<p class="mx-auto mt-3 max-w-2xl text-sm text-gray-500 dark:text-neutral-400 sm:text-base">
					{t('applyModes.heroSubtitle')}
				</p>
			</header>

			<ul class="grid grid-cols-1 gap-5 md:grid-cols-3">
				{#each modes as mode (mode.key)}
					{@const active = mode.key === currentMode}
					{@const ns = `applyModes.${mode.labelKey}`}
					<li class="h-full">
						<article
							class="relative flex h-full flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 bg-gradient-to-br {mode.tintClass} {active
								? mode.borderClass + ' shadow-lg'
								: 'border-gray-200 dark:border-neutral-700/60'}"
						>
							<div class="mb-4 flex items-center justify-between">
								<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-neutral-800">
									<mode.icon size={22} class={mode.iconClass} />
								</div>
								{#if active}
									<Badge intent="success" size="md">
										<span class="inline-flex items-center gap-1">
											<Check size={10} />
											{t('applyModes.badgeActive')}
										</span>
									</Badge>
								{:else if mode.available}
									<Badge intent="accent" size="md">
										{t('applyModes.badgeIncluded')}
									</Badge>
								{:else}
									<Badge intent="warning" size="md">
										<span class="inline-flex items-center gap-1">
											<Clock size={10} />
											{t('applyModes.badgeSoon')}
										</span>
									</Badge>
								{/if}
							</div>

							<div>
								<h2 class="text-lg font-bold text-gray-900 dark:text-neutral-100">
									{t(`${ns}.title`)}
								</h2>
								<p class="mt-0.5 text-sm font-medium text-gray-600 dark:text-neutral-400">
									{t(`${ns}.tagline`)}
								</p>
							</div>

							<p class="mt-3 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
								{t(`${ns}.description`)}
							</p>

							<ul class="mt-4 flex-1 space-y-2">
								{#each [1, 2, 3, 4] as i}
									<li class="flex items-start gap-2 text-sm text-gray-700 dark:text-neutral-300">
										<Check size={14} class="mt-0.5 shrink-0 text-emerald-500" />
										<span>{t(`${ns}.feature${i}`)}</span>
									</li>
								{/each}
							</ul>

							<div class="mt-6">
								{#if active}
									<Button variant="outline" size="sm" class="w-full" disabled>
										<Check size={14} />
										{t('applyModes.activeCta')}
									</Button>
								{:else if mode.available}
									<Button
										variant="solid"
										size="sm"
										class="w-full"
										onclick={() => setMode(mode.key)}
										disabled={$updateMutation.isPending}
									>
										{t('applyModes.switchCta')}
										<ArrowRight size={14} />
									</Button>
								{:else}
									<Button
										variant="outline"
										size="sm"
										class="w-full"
										onclick={notifyWhenReady}
									>
										{t('applyModes.soonCta')}
									</Button>
								{/if}
							</div>
						</article>
					</li>
				{/each}
			</ul>

			<p class="mt-6 text-center text-xs text-gray-500 dark:text-neutral-500">
				{t('applyModes.currentModeLabel')}:
				<span class="font-semibold text-gray-800 dark:text-neutral-200">
					{t(`applyModes.${modes.find((m) => m.key === currentMode)?.labelKey ?? 'oneClick'}.title`)}
				</span>
			</p>
		</main>
	</div>
{/if}
