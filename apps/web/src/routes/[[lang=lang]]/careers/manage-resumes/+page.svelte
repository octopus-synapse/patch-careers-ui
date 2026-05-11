<script lang="ts">
import { createGetV1Resumes } from 'api-client';
import { FileText, PenSquare, Sparkles } from 'lucide-svelte';
import { Badge, Button, Card, Skeleton } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import CvRerenderModal from './_components/cv-rerender-modal.svelte';
import { locale } from '$lib/state/locale.svelte';

// Shape matches the lean list DTO (PaginatedResumesDataDtoDataItem).
// The detail endpoint (/:id/full) is what includes `resumeSections`,
// `fullName`, `jobTitle`, `summary`, `template` — don't assume them here.
type Resume = {
  id: string;
  title: string | null;
  language?: string | null;
  targetRole?: string | null;
  isPublic?: boolean;
  slug?: string | null;
  // Optional fields that MAY appear in detail responses but are absent
  // from the list DTO — always treat as optional.
  fullName?: string | null;
  jobTitle?: string | null;
  summary?: string | null;
  template?: string | null;
  resumeSections?: Array<Record<string, unknown>>;
};

const t = $derived(locale.t);

const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);

$effect(() => {
  if (!auth.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});

const query = createGetV1Resumes(
  { page: 1, limit: 20 },
  { query: { enabled: () => browser && authenticated} },
);

const resumes = $derived.by<Resume[]>(() => {
  const d = $query.data as Record<string, unknown> | undefined;
  const arr =
    (d?.items as Resume[] | undefined) ??
    (d?.resumes as Resume[] | undefined) ??
    (d?.data as Resume[] | undefined) ??
    (Array.isArray(d) ? (d as Resume[]) : undefined) ??
    [];
  return arr;
});

/** First resume is treated as the "Master"; remaining are versions. If the
 *  backend ever adds an `isMaster` flag we can switch to that. */
const master = $derived(resumes[0]);
const versions = $derived(resumes.slice(1));

let rerenderOpen = $state(false);
let rerenderSummary = $state('');
let rerenderResumeId = $state<string | undefined>(undefined);

function openRerender(resume: Resume) {
  rerenderSummary = resume.summary?.trim() || t('cv.noSummary');
  rerenderResumeId = resume.id;
  rerenderOpen = true;
}
</script>

<svelte:head>
	<title>{t('cv.pageTitle')}</title>
</svelte:head>

{#if auth.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Skeleton shape="rect" width="12rem" height="1.5rem" />
	</div>
{:else if t && authenticated}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-4xl px-4 sm:px-6">
			<header class="mb-6">
				<h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
					{t('cv.pageTitle')}
				</h1>
			</header>

			{#if $query.isLoading}
				<div class="space-y-4">
					<Skeleton shape="rect" width="100%" height="8rem" />
					<Skeleton shape="rect" width="100%" height="8rem" />
				</div>
			{:else if resumes.length === 0}
				<div class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center dark:border-neutral-700/60 dark:bg-neutral-800/20">
					<FileText size={32} class="text-gray-300 dark:text-neutral-600" />
					<div class="space-y-1">
						<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
							{t('cv.emptyTitle')}
						</p>
						<p class="mx-auto max-w-sm text-xs text-gray-500 dark:text-neutral-500">
							{t('cv.emptyBody')}
						</p>
					</div>
					<Button variant="solid" size="sm" onclick={() => goto('/onboarding/start')}>
						{t('cv.emptyCta')}
					</Button>
				</div>
			{:else}
				<!-- Master -->
				{#if master}
					<Card>
						{#snippet title()}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<FileText size={16} class="text-gray-500 dark:text-neutral-400" />
									<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
										{master.title ?? master.fullName ?? t('cv.pageTitle')}
									</h2>
									<Badge intent="info" size="sm">{t('cv.masterLabel')}</Badge>
								</div>
								<Button variant="outline" size="sm" onclick={() => openRerender(master)}>
									<Sparkles size={14} />
									{t('cv.rerenderCta')}
								</Button>
							</div>
						{/snippet}

						<p class="text-[11px] text-gray-500 dark:text-neutral-500">{t('cv.masterHelp')}</p>

						<div class="mt-3 flex gap-4">
							<!-- Thumbnail endpoint may 404 for seeded users without a rendered
							     SVG; hide the image element if it fails so we don't show a
							     broken-image placeholder with alt text bleeding through. -->
							<img
								src="/api/v1/resumes/{master.id}/thumbnail.svg"
								alt=""
								class="hidden h-32 w-auto shrink-0 rounded border border-gray-200 dark:border-neutral-700 sm:block"
								loading="lazy"
								onerror={(e) => {
									(e.currentTarget as HTMLImageElement).style.display = 'none';
								}}
							/>
							<div class="min-w-0 flex-1 space-y-1.5">
								{#if master.jobTitle}
									<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">{master.jobTitle}</p>
								{/if}
								{#if master.summary}
									<p class="text-xs leading-relaxed text-gray-600 dark:text-neutral-400">
										{master.summary}
									</p>
								{/if}
							</div>
						</div>

						<div class="mt-4 flex items-center gap-3 text-[11px] text-gray-500 dark:text-neutral-500">
							{#if master.template}
								<Badge intent="neutral" size="md">
									<span class="font-mono">{master.template}</span>
								</Badge>
							{/if}
							{#if master.resumeSections}
								<span>{t('cv.cardSections', { count: master.resumeSections.length })}</span>
							{/if}
							{#if master.language}
								<span class="uppercase">{master.language}</span>
							{/if}
						</div>
					</Card>
				{/if}

				<!-- Versions -->
				<section class="mt-8">
					<h3 class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-500">
						{t('cv.versionsTitle')}
					</h3>
					{#if versions.length === 0}
						<p class="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500 dark:border-neutral-700/60 dark:bg-neutral-800/20 dark:text-neutral-500">
							{t('cv.versionsEmpty')}
						</p>
					{:else}
						<ul class="space-y-3">
							{#each versions as r (r.id)}
								<li>
									<Card>
										<div class="flex items-start justify-between gap-3">
											<img
												src="/api/v1/resumes/{r.id}/thumbnail.svg"
												alt=""
												class="hidden h-20 w-auto shrink-0 rounded border border-gray-200 dark:border-neutral-700 sm:block"
												loading="lazy"
												onerror={(e) => {
													(e.currentTarget as HTMLImageElement).style.display = 'none';
												}}
											/>
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2">
													<PenSquare size={14} class="text-gray-500 dark:text-neutral-400" />
													<p class="truncate text-sm font-medium text-gray-800 dark:text-neutral-200">
														{r.title ?? r.jobTitle ?? t('cv.pageTitle')}
													</p>
												</div>
												{#if r.summary}
													<p class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-neutral-500">
														{r.summary}
													</p>
												{/if}
												<div class="mt-2 flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-500">
													{#if r.template}
														<Badge intent="neutral" size="md">
															<span class="font-mono">{r.template}</span>
														</Badge>
													{/if}
													{#if r.resumeSections}
														<span>{t('cv.cardSections', { count: r.resumeSections.length })}</span>
													{/if}
												</div>
											</div>
											<Button variant="ghost" size="sm" onclick={() => openRerender(r)}>
												<Sparkles size={14} />
											</Button>
										</div>
									</Card>
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/if}
		</main>
	</div>

	<CvRerenderModal
		open={rerenderOpen}
		beforeText={rerenderSummary}
		resumeId={rerenderResumeId}
		onClose={() => (rerenderOpen = false)}
	/>
{/if}
