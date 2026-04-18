<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import { createResumesTailorForJob, getResumesListTailoredQueryKey } from 'api-client';
import { RotateCw, Sparkles } from 'lucide-svelte';
import { Button, Modal, toastState } from 'ui';
import { locale } from '$lib/locale.svelte';

type Segment = { text: string; highlight?: boolean };
type Scenario = {
  slug: string;
  role: string;
  company: string;
  afterSegments: Segment[];
};

type Props = {
  open: boolean;
  /** The user's current summary to show in the "before" panel. */
  beforeText: string;
  /** Master resume id. When present, the "Save as version" button calls
   *  POST /resumes/:id/tailor with the selected scenario description. */
  resumeId?: string;
  onClose: () => void;
};

let { open, beforeText, resumeId, onClose }: Props = $props();

const t = $derived(locale.t);

const queryClient = useQueryClient();
const tailorMutation = createResumesTailorForJob(() => ({
  mutation: {
    onSuccess() {
      if (resumeId) {
        queryClient.invalidateQueries({
          queryKey: getResumesListTailoredQueryKey(resumeId),
        });
      }
      toastState.show(t('cv.rerender.saveCta'), 'success');
      onClose();
    },
    onError() {
      toastState.show('Failed to save tailored version', 'danger');
    },
  },
}));

function handleSave() {
  if (!resumeId) return;
  tailorMutation.mutate({
    resumeId,
    data: {
      jobDescription: buildJobDescription(selected),
      jobTitle: selected.role,
      jobCompany: selected.company.split(' · ')[0],
    },
  });
}

function buildJobDescription(scenario: Scenario): string {
  return [
    scenario.role,
    `Company: ${scenario.company}`,
    scenario.afterSegments.map((s) => s.text).join(''),
  ].join('\n\n');
}

/** Same curated scenarios as the landing demo — tailored for the tech +
 *  remote-USD positioning. The rewrite simulation is client-side; a real
 *  backend rerender will replace this with LLM output. */
const scenarios: Scenario[] = [
  {
    slug: 'rust-vercel',
    role: 'Senior Rust Backend Engineer',
    company: 'Vercel · Remote · USD',
    afterSegments: [
      { text: 'Engenheiro backend especializado em ' },
      { text: 'Rust', highlight: true },
      { text: ' e sistemas distribuídos de alta performance. Projeta serviços em ' },
      { text: 'Tokio/Axum', highlight: true },
      { text: ' com p99 ' },
      { text: '< 120ms', highlight: true },
      { text: ', foco em observabilidade e custo. Remoto, inglês avançado, disponível pra USD.' },
    ],
  },
  {
    slug: 'data-ifood',
    role: 'Staff Data Engineer',
    company: 'iFood · Remote BR',
    afterSegments: [
      { text: 'Staff Data Engineer com 8+ anos em pipelines de grande volume. Lidera plataforma ' },
      { text: 'Databricks + Spark', highlight: true },
      { text: ' processando ' },
      { text: '4TB/dia', highlight: true },
      { text: ' pra analytics ' },
      { text: 'real-time', highlight: true },
      { text: '. Experiência migrando ETL em ' },
      { text: 'Airflow/AWS', highlight: true },
      { text: ' e modelagem dimensional.' },
    ],
  },
  {
    slug: 'sec-deel',
    role: 'Senior Security Engineer',
    company: 'Deel · Remote · USD',
    afterSegments: [
      { text: 'AppSec sênior com experiência liderando programas de ' },
      { text: 'SOC 2 Type II', highlight: true },
      { text: ' e ' },
      { text: 'ISO 27001', highlight: true },
      { text: '. Implementa ' },
      { text: 'threat modeling', highlight: true },
      { text: ' e secure SDLC em produtos em escala, parceria forte com times de engenharia.' },
    ],
  },
];

let selectedSlug = $state(scenarios[0].slug);
const selected = $derived(scenarios.find((s) => s.slug === selectedSlug) ?? scenarios[0]);

let typedChars = $state(0);
let isPlaying = $state(false);
let showStrike = $state(false);
let playTimer: ReturnType<typeof setInterval> | null = null;

const totalLen = $derived(selected.afterSegments.reduce((sum, s) => sum + s.text.length, 0));

const visibleSegments = $derived.by(() => {
  let remaining = typedChars;
  const out: Segment[] = [];
  for (const seg of selected.afterSegments) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, seg.text.length);
    out.push({ text: seg.text.slice(0, take), highlight: seg.highlight });
    remaining -= take;
  }
  return out;
});

function stopTimer() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function play() {
  stopTimer();
  isPlaying = true;
  showStrike = false;
  typedChars = 0;

  const strikeStart = setTimeout(() => {
    showStrike = true;
  }, 120);

  const typeStart = setTimeout(() => {
    playTimer = setInterval(() => {
      if (typedChars >= totalLen) {
        stopTimer();
        isPlaying = false;
        return;
      }
      typedChars = Math.min(totalLen, typedChars + 2);
    }, 18);
  }, 900);

  return () => {
    clearTimeout(strikeStart);
    clearTimeout(typeStart);
    stopTimer();
  };
}

function selectScenario(slug: string) {
  selectedSlug = slug;
  typedChars = 0;
  showStrike = false;
  isPlaying = false;
  stopTimer();
}

$effect(() => {
  // Replay each time the modal reopens so the animation tells the story.
  if (open) {
    const cleanup = play();
    return () => {
      cleanup?.();
      stopTimer();
    };
  }
  stopTimer();
});
</script>

<Modal {open} {onClose}>
	{#snippet title()}
		<span class="flex items-center gap-1.5">
			<Sparkles size={14} class="text-cyan-500" />
			{t('cv.rerender.title')}
		</span>
	{/snippet}

	<div class="space-y-4">
		<p class="text-xs text-gray-500 dark:text-neutral-500">{t('cv.rerender.subtitle')}</p>

		<!-- Scenario picker -->
		<div class="flex flex-wrap gap-2">
			{#each scenarios as scenario (scenario.slug)}
				{@const active = scenario.slug === selectedSlug}
				<button
					type="button"
					onclick={() => selectScenario(scenario.slug)}
					class="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all {active
						? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
						: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-400 dark:hover:border-neutral-600'}"
				>
					<span class="font-semibold">{scenario.role}</span>
					<span class="text-gray-400 dark:text-neutral-500">·</span>
					<span class="text-gray-400 dark:text-neutral-500">{scenario.company.split(' · ')[0]}</span>
				</button>
			{/each}
		</div>

		<!-- Before -->
		<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700/60 dark:bg-neutral-900/50">
			<p class="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				{t('cv.rerender.beforeLabel')}
			</p>
			<p
				class="text-sm leading-relaxed text-gray-700 transition-all duration-500 dark:text-neutral-300 {showStrike
					? 'line-through opacity-50'
					: ''}"
			>
				{beforeText}
			</p>
		</div>

		<!-- After -->
		<div class="rounded-xl border border-cyan-500/40 bg-gradient-to-br from-white to-cyan-50/40 p-4 shadow-[0_0_30px_-15px_rgba(6,182,212,0.4)] dark:from-neutral-900 dark:to-neutral-800/60">
			<p class="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
				<Sparkles size={10} />
				{t('cv.rerender.afterLabel', { role: selected.role })}
			</p>
			<p class="min-h-[4.5rem] text-sm leading-relaxed text-gray-800 dark:text-neutral-200">
				{#each visibleSegments as seg, i (i)}
					{#if seg.highlight}
						<span class="rounded bg-cyan-500/20 px-1 font-semibold text-cyan-700 dark:text-cyan-300">{seg.text}</span>
					{:else}
						<span>{seg.text}</span>
					{/if}
				{/each}
				{#if isPlaying}
					<span class="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-cyan-500 align-middle"></span>
				{/if}
			</p>
		</div>

		<div class="flex items-center justify-between">
			<p class="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-600">
				{t('cv.rerender.demoDisclaimer')}
			</p>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" onclick={play} disabled={isPlaying}>
					<RotateCw size={12} class={isPlaying ? 'animate-spin' : ''} />
					{isPlaying ? t('cv.rerender.playing') : t('cv.rerender.replay')}
				</Button>
				<Button
					variant="solid"
					size="sm"
					onclick={handleSave}
					disabled={!resumeId || tailorMutation.isPending}
				>
					{t('cv.rerender.saveCta')}
				</Button>
			</div>
		</div>
	</div>
</Modal>
