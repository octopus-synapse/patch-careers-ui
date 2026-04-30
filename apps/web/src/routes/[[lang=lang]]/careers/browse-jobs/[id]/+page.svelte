<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createJobsBookmark,
  createJobsFindById,
  createJobsGetFit,
  createJobsUnbookmark,
  createResumesGetAllUserResumes,
  getJobsFindAllQueryKey,
  getJobsFindByIdQueryKey,
  getJobsGetBookmarkedJobsQueryKey,
  getJobsGetMyApplicationsQueryKey,
  isApiError,
  jobsApply,
  jobsDelete,
  jobsUpdate,
  jobsWithdrawApplication,
} from 'api-client';
import type { ApplyToJobDto, UpdateJobDto, UpdateJobDtoJobType } from 'api-client';
import { ArrowLeft, Bookmark, Briefcase, Building2, CheckCircle2, DollarSign, ExternalLink, MapPin, Pencil, Send, Sparkles, Trash2 } from 'lucide-svelte';
import { Badge, Button, ConfirmModal, type FitDimension, FitScoreBreakdown, FormModal, Input, Label, Loader, Textarea, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import MatchScorePanel from '$lib/components/scoring/match-score-panel.svelte';
import { useAuth } from '$lib/state/auth.svelte';
import { track } from '$lib/utils/analytics/track';
import TailorForJobModal from './_components/tailor-for-job-modal.svelte';
import ApplyModal from '$lib/components/jobs/apply-modal.svelte';
import SimilarJobsCarousel from '$lib/components/jobs/similar-jobs-carousel.svelte';
import { locale } from '$lib/state/locale.svelte';

interface Job {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  salaryRange?: string;
  applyUrl?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: string;
  isBookmarked?: boolean;
  hasApplied?: boolean;
}

const t = $derived(locale.t);
const queryClient = useQueryClient();

const jobId = $derived(($page.params as Record<string, string>).id);

const auth = useAuth();
const currentUserId = $derived(String(auth.data?.user?.id ?? ''));

const jobQuery = createJobsFindById(
  () => jobId,
  () => ({ query: { enabled: browser && !!jobId } }),
);

const job = $derived(jobQuery.data as unknown as Job | undefined);
const isOwner = $derived(
  !!currentUserId && !!job && (job.userId === currentUserId || job.createdBy === currentUserId),
);

// Fit score — enabled for non-owners with a primary resume. Backend returns
// 409 NO_PRIMARY_RESUME when the user has no master CV yet; the component
// renders the teaser state automatically whenever `score` is undefined.
const fitQuery = createJobsGetFit(
  () => jobId,
  () => ({ query: { enabled: browser && !!jobId && !!currentUserId && !isOwner, retry: false } }),
);

// Primary resume lookup — the Match Score panel needs a resumeId. We take
// the first resume in the user's list as the "primary-ish" candidate;
// future iteration may expose a picker when the user has >1 resume.
const myResumesQuery = createResumesGetAllUserResumes(
  () => ({ userId: currentUserId, page: 1, limit: 1 }),
  () => ({ query: { enabled: browser && !!currentUserId && !isOwner, retry: false } }),
);
const primaryResumeId = $derived<string | null>(
  myResumesQuery.data &&
    typeof myResumesQuery.data === 'object' &&
    'data' in myResumesQuery.data &&
    Array.isArray((myResumesQuery.data as { data: unknown[] }).data) &&
    (myResumesQuery.data as { data: Array<{ id?: string }> }).data.length > 0
    ? ((myResumesQuery.data as { data: Array<{ id?: string }> }).data[0]?.id ?? null)
    : null,
);

type FitResponse = {
  matchScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  dimensions?: { hardSkills?: number; softSkills?: number };
};
const fit = $derived(fitQuery.data as unknown as FitResponse | undefined);

// Bookmark state — server-driven via job.isBookmarked, with an optimistic
// override that wins until the next refetch lands.
let optimisticBookmarked = $state<boolean | null>(null);
const isBookmarked = $derived(optimisticBookmarked ?? Boolean(job?.isBookmarked));

const bookmarkMutation = createJobsBookmark(() => ({
  mutation: {
    onSuccess() {
      optimisticBookmarked = null;
      queryClient.invalidateQueries({ queryKey: getJobsGetBookmarkedJobsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getJobsFindByIdQueryKey(jobId) });
      queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
      track('job_bookmarked', { jobId });
    },
    onError() {
      optimisticBookmarked = Boolean(job?.isBookmarked);
      toastState.show(locale.t('jobs.saveError'), 'danger');
    },
  },
}));

const unbookmarkMutation = createJobsUnbookmark(() => ({
  mutation: {
    onSuccess() {
      optimisticBookmarked = null;
      queryClient.invalidateQueries({ queryKey: getJobsGetBookmarkedJobsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getJobsFindByIdQueryKey(jobId) });
      queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
      track('job_unbookmarked', { jobId });
    },
    onError() {
      optimisticBookmarked = Boolean(job?.isBookmarked);
      toastState.show(locale.t('jobs.unsaveError'), 'danger');
    },
  },
}));

function toggleBookmark() {
  const wasBookmarked = isBookmarked;
  optimisticBookmarked = !wasBookmarked;
  if (wasBookmarked) unbookmarkMutation.mutate({ id: jobId });
  else bookmarkMutation.mutate({ id: jobId });
}

// Apply state — server-driven, override otimista.
let optimisticApplied = $state<boolean | null>(null);
const hasApplied = $derived(optimisticApplied ?? Boolean(job?.hasApplied));
let showApplyModal = $state(false);
let showTailorModal = $state(false);
let withdrawConfirm = $state(false);
let applying = $state(false);
let withdrawing = $state(false);

function invalidateJobQueries() {
  queryClient.invalidateQueries({ queryKey: getJobsFindByIdQueryKey(jobId) });
  queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
  queryClient.invalidateQueries({ queryKey: getJobsGetMyApplicationsQueryKey() });
}

async function submitApplication(coverLetter: string) {
  if (applying) return;
  applying = true;
  try {
    const payload: ApplyToJobDto = coverLetter ? { coverLetter } : {};
    await jobsApply(jobId, payload);
    optimisticApplied = true;
    showApplyModal = false;
    invalidateJobQueries();
    track('job_apply_submitted', { jobId });
    toastState.show(locale.t('jobs.applySuccess'), 'success');
  } catch (err) {
    const message =
      isApiError(err) && err.statusCode === 403
        ? locale.t('jobs.applyOwnerError')
        : isApiError(err) && err.statusCode === 409
          ? locale.t('jobs.applyAlreadyError')
          : locale.t('jobs.applyError');
    toastState.show(message, 'danger');
  } finally {
    applying = false;
  }
}

async function confirmWithdraw() {
  if (withdrawing) return;
  withdrawing = true;
  try {
    await jobsWithdrawApplication(jobId);
    optimisticApplied = false;
    withdrawConfirm = false;
    invalidateJobQueries();
    track('job_application_withdrawn', { jobId });
  } catch {
    toastState.show(locale.t('jobs.applyWithdrawError'), 'danger');
  } finally {
    withdrawing = false;
  }
}

// Edit modal
let editModal = $state(false);
let editLoading = $state(false);
let formTitle = $state('');
let formCompany = $state('');
let formLocation = $state('');
let formJobType = $state('Full-time');
let formDescription = $state('');
let formRequirements = $state('');
let formSkills = $state('');
let formSalaryRange = $state('');
let formApplyUrl = $state('');

// Delete modal
let deleteConfirm = $state(false);
let deleteLoading = $state(false);

const jobTypes = ['Internship', 'Contract', 'Full-time', 'Part-time', 'Volunteer', 'Freelance'];

function openEdit() {
  if (!job) return;
  formTitle = job.title ?? '';
  formCompany = job.company ?? '';
  formLocation = job.location ?? '';
  formJobType = job.jobType ?? 'Full-time';
  formDescription = job.description ?? '';
  formRequirements = job.requirements?.join(', ') ?? '';
  formSkills = job.skills?.join(', ') ?? '';
  formSalaryRange = job.salaryRange ?? '';
  formApplyUrl = job.applyUrl ?? '';
  editModal = true;
}

async function handleEdit() {
  editLoading = true;
  try {
    const data: UpdateJobDto = {
      title: formTitle,
      company: formCompany,
      location: formLocation || undefined,
      jobType: formJobType as UpdateJobDtoJobType,
      description: formDescription,
      requirements: formRequirements
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
      skills: formSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      salaryRange: formSalaryRange || undefined,
      applyUrl: formApplyUrl || undefined,
    };
    await jobsUpdate(jobId, data);
    queryClient.invalidateQueries({ queryKey: getJobsFindByIdQueryKey(jobId) });
    queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
    editModal = false;
  } finally {
    editLoading = false;
  }
}

async function handleDelete() {
  deleteLoading = true;
  try {
    await jobsDelete(jobId);
    queryClient.invalidateQueries({ queryKey: getJobsFindAllQueryKey() });
    goto('/careers/browse-jobs');
  } finally {
    deleteLoading = false;
    deleteConfirm = false;
  }
}

const fitLabels = $derived({
  title: t('jobs.fit.title'),
  scoreAria: (v: number) => t('jobs.fit.scoreAria', { value: v }),
  breakdownTitle: t('jobs.fit.breakdownTitle'),
  matchedTitle: t('jobs.fit.matchedTitle'),
  missingTitle: t('jobs.fit.missingTitle'),
  teaserTitle: t('jobs.fit.teaserTitle'),
  teaserBody: t('jobs.fit.teaserBody'),
  teaserCta: t('jobs.fit.teaserCta'),
});

const dimensionLabels: Record<string, string> = $derived({
  hardSkills: t('jobs.fit.dimHardSkills'),
  softSkills: t('jobs.fit.dimSoftSkills'),
  experience: t('jobs.fit.dimExperience'),
  languages: t('jobs.fit.dimLanguages'),
  location: t('jobs.fit.dimLocation'),
});

const fitDimensions = $derived.by<FitDimension[] | undefined>(() => {
  if (!fit?.dimensions) return undefined;
  const out: FitDimension[] = [];
  for (const [key, value] of Object.entries(fit.dimensions)) {
    if (typeof value !== 'number') continue;
    out.push({ key, label: dimensionLabels[key] ?? key, value });
  }
  return out.length > 0 ? out : undefined;
});
</script>

<svelte:head>
	<title>{job?.title ?? t('jobs.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-3 sm:px-6">
		<a href="/careers/browse-jobs" class="mb-6 inline-flex items-center gap-1.5 text-xs font-medium transition-colors text-gray-500 dark:text-neutral-500 hover:text-gray-800 dark:hover:text-neutral-200">
			<ArrowLeft size={14} />
			{t('common.back')}
		</a>

		{#if jobQuery.isLoading}
			<div class="flex items-center justify-center py-20">
				<Loader size={20} />
			</div>
		{:else if !job}
			<div class="py-20 text-center">
				<p class="text-sm text-gray-500 dark:text-neutral-500">Job not found</p>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Job header card -->
				<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
					<div class="flex items-start justify-between">
						<div class="space-y-2">
							<h1 class="text-2xl font-bold tracking-tight text-gray-800 dark:text-neutral-200">{job.title}</h1>
							<div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-neutral-500">
								{#if job.company}
									<span class="flex items-center gap-1">
										<Building2 size={14} />
										{job.company}
									</span>
								{/if}
								{#if job.location}
									<span class="flex items-center gap-1">
										<MapPin size={14} />
										{job.location}
									</span>
								{/if}
								{#if job.jobType}
									<Badge intent="info" size="md">
										<span class="inline-flex items-center gap-1">
											<Briefcase size={12} />
											{job.jobType}
										</span>
									</Badge>
								{/if}
								{#if job.salaryRange}
									<span class="flex items-center gap-1">
										<DollarSign size={14} />
										{job.salaryRange}
									</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2">
							{#if currentUserId && !isOwner}
								{#if hasApplied}
									<Button
										variant="solid"
										intent="success"
										size="sm"
										onclick={() => (withdrawConfirm = true)}
										disabled={withdrawing}
									>
										<CheckCircle2 size={14} />
										{t('jobs.applyApplied')}
									</Button>
								{:else}
									<Button
										variant="solid"
										intent="accent"
										size="sm"
										onclick={() => (showApplyModal = true)}
										disabled={applying}
									>
										<Send size={14} />
										{t('jobs.applyQuick')}
									</Button>
								{/if}
							{/if}
							{#if currentUserId}
								<Button
									variant={isBookmarked ? 'solid' : 'outline'}
									intent={isBookmarked ? 'accent' : 'neutral'}
									size="sm"
									onclick={toggleBookmark}
									disabled={bookmarkMutation.isPending || unbookmarkMutation.isPending}
								>
									<Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
									{isBookmarked ? t('jobs.unsaveJob') : t('jobs.saveJob')}
								</Button>
							{/if}
							{#if currentUserId && !isOwner}
								<Button
									variant="outline"
									size="sm"
									onclick={() => (showTailorModal = true)}
								>
									<Sparkles size={14} />
									Personalizar CV
								</Button>
							{/if}
							{#if isOwner}
								<Button variant="outline" size="sm" onclick={openEdit}>
									<Pencil size={14} />
									{t('jobs.edit')}
								</Button>
								<Button variant="ghost" intent="danger" size="sm" onclick={() => deleteConfirm = true}>
									<Trash2 size={14} />
									{t('jobs.delete')}
								</Button>
							{/if}
						</div>
					</div>
				</div>

				{#if currentUserId && !isOwner}
					{#if primaryResumeId}
						<MatchScorePanel resumeId={primaryResumeId} {jobId} />
					{:else}
						<FitScoreBreakdown
							score={fit?.matchScore}
							dimensions={fitDimensions}
							matched={fit?.matchedKeywords ?? []}
							missing={fit?.missingKeywords ?? []}
							labels={fitLabels}
							onTeaserCta={() => goto('/careers/manage-resumes')}
						/>
					{/if}
				{/if}

				<!-- Description -->
				{#if job.description}
					<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-4 sm:p-6">
						<h2 class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-500">
							{t('jobs.description')}
						</h2>
						<div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-neutral-200">{job.description}</div>
					</div>
				{/if}

				<!-- Requirements -->
				{#if job.requirements?.length}
				{@const requirements = job.requirements}
					<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
						<h2 class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-500">
							{t('jobs.requirements')}
						</h2>
						<ul class="list-disc space-y-1.5 pl-5 text-sm text-gray-800 dark:text-neutral-200">
							{#each requirements as req}
								<li>{req}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Skills -->
				{#if job.skills?.length}
				{@const skills = job.skills}
					<div class="rounded-xl border border-gray-200 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 p-6">
						<h2 class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-500">
							{t('jobs.skills')}
						</h2>
						<div class="flex flex-wrap gap-2">
							{#each skills as skill}
								<Badge intent="neutral" size="md">{skill}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Apply -->
				{#if job.applyUrl}
					<div class="flex justify-center">
						<a
							href={job.applyUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="solid" size="lg">
								<ExternalLink size={16} />
								{t('jobs.apply')}
							</Button>
						</a>
					</div>
				{/if}

				<!-- Similar jobs -->
				<SimilarJobsCarousel {jobId} />
			</div>
		{/if}
	</div>
</div>

<!-- Edit Job Modal -->
<FormModal
	open={editModal}
	title={t('jobs.edit')}
	loading={editLoading}
	onSubmit={handleEdit}
	onClose={() => editModal = false}
>
	<div class="space-y-3">
		<div>
			<Label>{t('jobs.title')} *</Label>
			<Input bind:value={formTitle} placeholder="Software Engineer" required />
		</div>
		<div>
			<Label>{t('jobs.company')} *</Label>
			<Input bind:value={formCompany} placeholder="Acme Inc." required />
		</div>
		<div>
			<Label>{t('jobs.location')}</Label>
			<Input bind:value={formLocation} placeholder="Remote / San Francisco, CA" />
		</div>
		<div>
			<Label>{t('jobs.type')} *</Label>
			<select
				bind:value={formJobType}
				class="w-full rounded-lg border px-3 py-1.5 text-sm outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
			>
				{#each jobTypes as jt}
					<option value={jt}>{jt}</option>
				{/each}
			</select>
		</div>
		<div>
			<Label>{t('jobs.description')} *</Label>
			<Textarea
				bind:value={formDescription}
				placeholder="Job description..."
				required
				rows={4}
			/>
		</div>
		<div>
			<Label>{t('jobs.requirements')}</Label>
			<Input bind:value={formRequirements} placeholder="React, TypeScript, 3+ years..." />
			<span class="text-[10px] text-gray-500 dark:text-neutral-500">Comma-separated</span>
		</div>
		<div>
			<Label>{t('jobs.skills')}</Label>
			<Input bind:value={formSkills} placeholder="React, Node.js, PostgreSQL..." />
			<span class="text-[10px] text-gray-500 dark:text-neutral-500">Comma-separated</span>
		</div>
		<div>
			<Label>{t('jobs.salary')}</Label>
			<Input bind:value={formSalaryRange} placeholder="$80k - $120k" />
		</div>
		<div>
			<Label>{t('jobs.applyUrl')}</Label>
			<Input bind:value={formApplyUrl} placeholder="https://example.com/apply" type="url" />
		</div>
	</div>
</FormModal>

<!-- Delete Confirm Modal -->
<ConfirmModal
	open={deleteConfirm}
	title={t('jobs.delete')}
	message={t('jobs.confirmDelete')}
	loading={deleteLoading}
	onConfirm={handleDelete}
	onClose={() => deleteConfirm = false}
/>

<!-- Apply Modal -->
<ApplyModal
	open={showApplyModal}
	jobTitle={job?.title ?? ''}
	submitting={applying}
	onsubmit={submitApplication}
	oncancel={() => (showApplyModal = false)}
/>

<!-- Tailor CV with AI Modal (#45) -->
<TailorForJobModal
	open={showTailorModal}
	onClose={() => (showTailorModal = false)}
	jobId={jobId}
	jobTitle={job?.title}
	jobCompany={job?.company}
	jobDescription={job?.description}
/>

<!-- Withdraw Application Confirm -->
<ConfirmModal
	open={withdrawConfirm}
	title={t('jobs.applyWithdraw')}
	message=""
	loading={withdrawing}
	onConfirm={confirmWithdraw}
	onClose={() => (withdrawConfirm = false)}
/>
