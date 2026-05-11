<script lang="ts">
import {
  createGetV1AuthOauthAvailableProvider,
  getBaseUrl,
  postV1ResumesImportsPdf,
} from 'api-client';
import { ArrowRight, Clock, FileUp, Github, Linkedin, PencilLine } from 'lucide-svelte';
import { Badge, Button, Loader, Modal, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const session = useAuth();
const authenticated = $derived(session.isAuthenticated);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

// Ask the backend whether each provider is wired (CLIENT_ID/SECRET present).
// Keeps the cards in a truthful state without us hardcoding flags.
const githubAvailability = createGetV1AuthOauthAvailableProvider(
  'github',
  { query: { enabled: () => browser} },
);
const linkedinAvailability = createGetV1AuthOauthAvailableProvider(
  'linkedin',
  { query: { enabled: () => browser} },
);

const githubAvailable = $derived($githubAvailability.data?.available ?? false);
const linkedinAvailable = $derived($linkedinAvailability.data?.available ?? false);

type TrackKey = 'linkedin' | 'github' | 'upload' | 'manual';

let soonOpen = $state(false);
let pdfInput = $state<HTMLInputElement | null>(null);
let pdfPending = $state(false);

async function handlePdfSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  pdfPending = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    await postV1ResumesImportsPdf({ data: formData });
    toastState.show('CV imported', 'success');
    goto('/careers/manage-resumes');
  } catch {
    toastState.show('Could not import the PDF', 'danger');
  } finally {
    pdfPending = false;
    target.value = '';
  }
}

function choose(track: TrackKey) {
  if (track === 'manual') {
    goto('/onboarding');
    return;
  }
  if (track === 'github') {
    if (!githubAvailable) {
      soonOpen = true;
      return;
    }
    window.location.href = `${getBaseUrl()}/api/v1/auth/oauth/github/start`;
    return;
  }
  if (track === 'linkedin') {
    if (!linkedinAvailable) {
      soonOpen = true;
      return;
    }
    window.location.href = `${getBaseUrl()}/api/v1/auth/oauth/linkedin/start`;
    return;
  }
  if (track === 'upload') {
    pdfInput?.click();
    return;
  }
}

const tracks: Array<{
  key: TrackKey;
  icon: typeof Linkedin;
  titleKey: string;
  descKey: string;
  iconClass: string;
  badgeKey: string | null;
}> = [
  {
    key: 'linkedin',
    icon: Linkedin,
    titleKey: 'onboarding.start.importLinkedIn',
    descKey: 'onboarding.start.importLinkedInDesc',
    iconClass: 'text-sky-500',
    badgeKey: 'onboarding.start.badgeFastest',
  },
  {
    key: 'github',
    icon: Github,
    titleKey: 'onboarding.start.importGitHub',
    descKey: 'onboarding.start.importGitHubDesc',
    iconClass: 'text-gray-800 dark:text-neutral-200',
    badgeKey: null,
  },
  {
    key: 'upload',
    icon: FileUp,
    titleKey: 'onboarding.start.uploadCv',
    descKey: 'onboarding.start.uploadCvDesc',
    iconClass: 'text-violet-500',
    badgeKey: null,
  },
  {
    key: 'manual',
    icon: PencilLine,
    titleKey: 'onboarding.start.manualWizard',
    descKey: 'onboarding.start.manualWizardDesc',
    iconClass: 'text-emerald-500',
    badgeKey: 'onboarding.start.badgeRecommended',
  },
];

function isAvailable(key: TrackKey): boolean {
  switch (key) {
    case 'linkedin':
      return linkedinAvailable;
    case 'github':
      return githubAvailable;
    case 'upload':
      return true; // Always wired — PDF upload doesn't need OAuth.
    case 'manual':
      return true;
  }
}
</script>

<svelte:head>
	<title>{t('onboarding.pageTitle')}</title>
</svelte:head>

<input
	bind:this={pdfInput}
	type="file"
	accept="application/pdf"
	class="hidden"
	onchange={handlePdfSelected}
/>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader size={24} />
	</div>
{:else if t && authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-4xl px-4 sm:px-6">
			<header class="mb-8 text-center">
				<h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100 sm:text-3xl">
					{t('onboarding.start.title')}
				</h1>
				<p class="mx-auto mt-2 max-w-xl text-sm text-gray-500 dark:text-neutral-400">
					{t('onboarding.start.subtitle')}
				</p>
			</header>

			<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each tracks as track (track.key)}
					{@const available = isAvailable(track.key)}
					<li>
						<button
							type="button"
							onclick={() => choose(track.key)}
							disabled={track.key === 'upload' && pdfPending}
							class="group flex h-full w-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700/60 dark:bg-neutral-800/50 dark:hover:border-neutral-600"
						>
							<div class="flex items-start justify-between">
								<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-neutral-900">
									<track.icon size={20} class={track.iconClass} />
								</div>
								<div class="flex items-center gap-2">
									{#if track.badgeKey}
										<span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-white dark:bg-neutral-200 dark:text-neutral-900">
											{t(track.badgeKey)}
										</span>
									{/if}
									{#if !available}
										<Badge intent="warning" size="md">
											<span class="inline-flex items-center gap-1">
												<Clock size={10} />
												{t('onboarding.start.badgeSoon')}
											</span>
										</Badge>
									{/if}
								</div>
							</div>

							<div class="flex-1">
								<h2 class="text-base font-semibold text-gray-900 dark:text-neutral-100">
									{t(track.titleKey)}
								</h2>
								<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
									{t(track.descKey)}
								</p>
							</div>

							<div class="flex items-center gap-1 text-xs font-semibold text-gray-500 transition-colors group-hover:text-gray-800 dark:text-neutral-500 dark:group-hover:text-neutral-200">
								{#if track.key === 'upload' && pdfPending}
									<Loader size={12} />
								{:else}
									<span>{t(available ? 'onboarding.next' : 'onboarding.start.close')}</span>
									<ArrowRight size={12} class="transition-transform group-hover:translate-x-0.5" />
								{/if}
							</div>
						</button>
					</li>
				{/each}
			</ul>
		</main>
	</div>

	<Modal open={soonOpen} onClose={() => (soonOpen = false)}>
		{#snippet title()}
			{t('onboarding.start.comingSoonTitle')}
		{/snippet}
		<p class="text-sm text-gray-600 dark:text-neutral-400">
			{t('onboarding.start.comingSoonBody')}
		</p>
		<div class="mt-4 flex items-center justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={() => (soonOpen = false)}>
				{t('onboarding.start.close')}
			</Button>
			<Button
				variant="solid"
				size="sm"
				onclick={() => {
					soonOpen = false;
					goto('/onboarding');
				}}
			>
				{t('onboarding.start.useManualInstead')}
			</Button>
		</div>
	</Modal>
{/if}
