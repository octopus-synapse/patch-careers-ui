<script lang="ts">
type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'muted';

type Kpi = {
  label: string;
  value: number;
  tone?: Tone;
};

type OfferSub = {
  label: string;
  value: number;
  tone: Tone;
};

const applicationState: Kpi[] = [
  { label: 'Draft', value: 2, tone: 'muted' },
  { label: 'Submitted', value: 14, tone: 'info' },
  { label: 'Withdrawn', value: 1, tone: 'neutral' },
];

const pipelineMain: Kpi[] = [
  { label: 'Under Review', value: 6, tone: 'info' },
  { label: 'Assessment', value: 3, tone: 'warning' },
  { label: 'Interview', value: 2, tone: 'warning' },
  { label: 'On Hold', value: 1, tone: 'neutral' },
];

const offerTotal = 4;
const offerSubs: OfferSub[] = [
  { label: 'Pending', value: 2, tone: 'warning' },
  { label: 'Accepted', value: 1, tone: 'success' },
  { label: 'Declined', value: 1, tone: 'danger' },
];

const finalOutcome: Kpi[] = [
  { label: 'Hired', value: 1, tone: 'success' },
  { label: 'Rejected', value: 5, tone: 'danger' },
  { label: 'Closed', value: 2, tone: 'neutral' },
  { label: 'On Hold (paused)', value: 1, tone: 'neutral' },
  { label: 'Talent Pool', value: 3, tone: 'info' },
];

const toneText: Record<Tone, string> = {
  neutral: 'text-gray-900 dark:text-neutral-100',
  info: 'text-sky-600 dark:text-sky-400',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-red-600 dark:text-red-400',
  muted: 'text-gray-500 dark:text-neutral-500',
};

const toneDot: Record<Tone, string> = {
  neutral: 'bg-gray-400 dark:bg-neutral-500',
  info: 'bg-sky-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  muted: 'bg-gray-300 dark:bg-neutral-700',
};
</script>

<div class="flex flex-col gap-8">
	<!-- Section 1: Application State -->
	<section>
		<header class="mb-3 flex items-baseline justify-between">
			<h2 class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				Application State
			</h2>
			<span class="text-xs text-gray-400 dark:text-neutral-600">Lifecycle entry</span>
		</header>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{#each applicationState as kpi (kpi.label)}
				{@const tone = kpi.tone ?? 'neutral'}
				<div
					class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm shadow-gray-900/[0.02] transition-colors hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:hover:border-neutral-700"
				>
					<div class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full {toneDot[tone]}"></span>
						<span class="text-xs font-medium text-gray-500 dark:text-neutral-400">{kpi.label}</span>
					</div>
					<div class="mt-2 text-3xl font-semibold tabular-nums {toneText[tone]}">
						{kpi.value}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Section 2: Active Pipeline -->
	<section>
		<header class="mb-3 flex items-baseline justify-between">
			<h2 class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				Active Pipeline
			</h2>
			<span class="text-xs text-gray-400 dark:text-neutral-600">In motion</span>
		</header>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each pipelineMain as kpi (kpi.label)}
				{@const tone = kpi.tone ?? 'neutral'}
				<div
					class="rounded-xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm shadow-gray-900/[0.02] transition-colors hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:hover:border-neutral-700"
				>
					<div class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full {toneDot[tone]}"></span>
						<span class="text-xs font-medium text-gray-500 dark:text-neutral-400">{kpi.label}</span>
					</div>
					<div class="mt-2 text-3xl font-semibold tabular-nums {toneText[tone]}">
						{kpi.value}
					</div>
				</div>
			{/each}
		</div>

		<!-- Offer card with sub-states -->
		<div
			class="mt-3 rounded-xl border border-gray-200/80 bg-white shadow-sm shadow-gray-900/[0.02] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
		>
			<div class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-3">
					<span class="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
					<div>
						<div class="text-xs font-medium text-gray-500 dark:text-neutral-400">Offer</div>
						<div class="text-3xl font-semibold tabular-nums text-cyan-600 dark:text-cyan-400">
							{offerTotal}
						</div>
					</div>
				</div>
				<div class="grid w-full grid-cols-3 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:w-auto sm:min-w-[420px] dark:border-neutral-800 dark:bg-neutral-800">
					{#each offerSubs as sub (sub.label)}
						<div class="flex flex-col gap-1 bg-white px-4 py-2.5 dark:bg-neutral-900">
							<div class="flex items-center gap-1.5">
								<span class="h-1 w-1 rounded-full {toneDot[sub.tone]}"></span>
								<span class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-500">
									{sub.label}
								</span>
							</div>
							<span class="text-xl font-semibold tabular-nums {toneText[sub.tone]}">
								{sub.value}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Section 3: Final Outcome -->
	<section>
		<header class="mb-3 flex items-baseline justify-between">
			<h2 class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				Final Outcome
			</h2>
			<span class="text-xs text-gray-400 dark:text-neutral-600">Closed loops</span>
		</header>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{#each finalOutcome as kpi (kpi.label)}
				{@const tone = kpi.tone ?? 'neutral'}
				<div
					class="rounded-xl border border-gray-200/80 bg-white px-5 py-4 shadow-sm shadow-gray-900/[0.02] transition-colors hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:hover:border-neutral-700"
				>
					<div class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full {toneDot[tone]}"></span>
						<span class="text-xs font-medium text-gray-500 dark:text-neutral-400">{kpi.label}</span>
					</div>
					<div class="mt-2 text-3xl font-semibold tabular-nums {toneText[tone]}">
						{kpi.value}
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
