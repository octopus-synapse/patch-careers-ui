<script lang="ts">
import { ArrowRight, RotateCw, Sparkles } from 'lucide-svelte';

/** Pre-scripted demo: the landing doesn't hit the backend. Three curated
 *  scenarios showcase the "tech + remote-USD" positioning. The typewriter
 *  is a pure client-side effect — we're selling the shape of the outcome,
 *  not calling a real model. */
type Segment = { text: string; highlight?: boolean };

type Scenario = {
  slug: string;
  role: string;
  company: string;
  tags: string[];
  before: string;
  afterSegments: Segment[];
};

const scenarios: Scenario[] = [
  {
    slug: 'rust-vercel',
    role: 'Senior Rust Backend Engineer',
    company: 'Vercel · Remote · USD',
    tags: ['Rust', 'Remote USD', 'Senior'],
    before:
      'Desenvolveu microsserviços em backend com boa performance e boas práticas de engenharia.',
    afterSegments: [
      { text: 'Projetou microsserviços em ' },
      { text: 'Rust', highlight: true },
      { text: ' com ' },
      { text: 'Tokio/Axum', highlight: true },
      { text: ' servindo ' },
      { text: '45k req/s', highlight: true },
      { text: ' com ' },
      { text: 'p99 < 120ms', highlight: true },
      { text: ', reduzindo custo de infra em ' },
      { text: '38%', highlight: true },
      { text: ' vs. implementação anterior em Go.' },
    ],
  },
  {
    slug: 'data-ifood',
    role: 'Staff Data Engineer',
    company: 'iFood · Remote BR',
    tags: ['Databricks', 'Staff', 'Real-time'],
    before: 'Construiu pipelines de dados em cloud processando grandes volumes.',
    afterSegments: [
      { text: 'Construiu pipelines em ' },
      { text: 'Databricks + Spark', highlight: true },
      { text: ' processando ' },
      { text: '4TB/dia', highlight: true },
      { text: ' para analytics ' },
      { text: 'real-time', highlight: true },
      { text: ', migrando ETL legado em ' },
      { text: 'Airflow/AWS', highlight: true },
      { text: ' com ' },
      { text: '52%', highlight: true },
      { text: ' de redução no tempo de processamento.' },
    ],
  },
  {
    slug: 'sec-deel',
    role: 'Senior Security Engineer',
    company: 'Deel · Remote · USD',
    tags: ['AppSec', 'SOC 2', 'Remote USD'],
    before: 'Melhorou a segurança de aplicações e trabalhou em compliance.',
    afterSegments: [
      { text: 'Liderou iniciativa de ' },
      { text: 'SOC 2 Type II', highlight: true },
      { text: ' e ' },
      { text: 'ISO 27001', highlight: true },
      { text: ', implementando ' },
      { text: 'threat modeling', highlight: true },
      { text: ' em ' },
      { text: '12 produtos', highlight: true },
      { text: ' e reduzindo incidentes críticos em ' },
      { text: '67%', highlight: true },
      { text: ' em 8 meses.' },
    ],
  },
];

let selectedSlug = $state(scenarios[0].slug);
const selected = $derived(scenarios.find((s) => s.slug === selectedSlug) ?? scenarios[0]);

/** Characters revealed in the "after" panel during typewriter playback. */
let typedChars = $state(0);
let isPlaying = $state(false);
let showStrike = $state(false);
let playTimer: ReturnType<typeof setInterval> | null = null;

const totalLen = $derived(selected.afterSegments.reduce((sum, s) => sum + s.text.length, 0));

/** Slice the pre-parsed segments so characters reveal in order across highlights. */
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

  // Step 1: strike through the "before" text for a beat.
  const strikeStart = setTimeout(() => {
    showStrike = true;
  }, 120);

  // Step 2: start typing the "after" text.
  const typeStart = setTimeout(() => {
    playTimer = setInterval(() => {
      if (typedChars >= totalLen) {
        stopTimer();
        isPlaying = false;
        return;
      }
      // Vary speed a touch: faster through plain text, a beat of pause at
      // highlighted boundaries makes them feel earned.
      typedChars = Math.min(totalLen, typedChars + 2);
    }, 18);
  }, 900);

  // Cleanup on component teardown.
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
  // Autoplay first load after layout settles.
  const cleanup = play();
  return () => {
    cleanup?.();
    stopTimer();
  };
});
</script>

<section class="relative overflow-hidden bg-black px-4 py-20 sm:px-6 sm:py-32">
	<div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08),transparent_60%)]"></div>

	<div class="mx-auto max-w-6xl">
		<div class="mb-10 text-center">
			<p class="mb-3 font-mono text-xs uppercase tracking-[0.4em] text-cyan-500">Veja a mágica</p>
			<h2 class="text-3xl font-black uppercase leading-none tracking-tighter text-white sm:text-5xl md:text-7xl">
				Um CV.
				<br />
				<span class="text-cyan-400">Reescrito</span> pra cada vaga.
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-sm text-zinc-500 sm:text-base">
				Escolha uma vaga e veja a IA reescrevendo o mesmo currículo em tempo real.
			</p>
		</div>

		<!-- Scenario picker -->
		<div class="mb-6 flex flex-wrap items-center justify-center gap-2">
			{#each scenarios as scenario (scenario.slug)}
				{@const active = scenario.slug === selectedSlug}
				<button
					type="button"
					onclick={() => selectScenario(scenario.slug)}
					class="group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all {active
						? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
						: 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
				>
					<span class="font-semibold">{scenario.role}</span>
					<span class="text-zinc-500">·</span>
					<span class="text-zinc-500">{scenario.company.split(' · ')[0]}</span>
				</button>
			{/each}
		</div>

		<!-- Before / After panels -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- Before -->
			<div class="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
				<div class="mb-3 flex items-center justify-between">
					<span class="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
						Seu currículo genérico
					</span>
					<span class="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500">Antes</span>
				</div>
				<p
					class="text-sm leading-relaxed text-zinc-400 transition-all duration-500 {showStrike
						? 'line-through opacity-50'
						: ''}"
				>
					{selected.before}
				</p>
			</div>

			<!-- After -->
			<div class="relative rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-zinc-950 to-zinc-900 p-5 shadow-[0_0_60px_-20px_rgba(6,182,212,0.4)] sm:p-7">
				<div class="mb-3 flex items-center justify-between">
					<span class="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
						<Sparkles size={10} />
						Reescrito pro {selected.role.split(' ').slice(-2).join(' ').toLowerCase()}
					</span>
					<span class="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400">Depois</span>
				</div>
				<p class="text-sm leading-relaxed text-zinc-100">
					{#each visibleSegments as seg, i (i)}
						{#if seg.highlight}
							<span class="rounded bg-cyan-500/20 px-1 font-semibold text-cyan-300">{seg.text}</span>
						{:else}
							<span>{seg.text}</span>
						{/if}
					{/each}
					{#if isPlaying}
						<span class="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-cyan-400 align-middle"></span>
					{/if}
				</p>

				<!-- Tag chips from the scenario -->
				<div class="mt-5 flex flex-wrap gap-1.5">
					{#each selected.tags as tag}
						<span class="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
							{tag}
						</span>
					{/each}
				</div>
			</div>
		</div>

		<!-- Replay + CTA -->
		<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<button
				type="button"
				onclick={play}
				disabled={isPlaying}
				class="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
			>
				<RotateCw size={12} class={isPlaying ? 'animate-spin' : ''} />
				{isPlaying ? 'Rodando…' : 'Ver de novo'}
			</button>

			<a
				href="/identity/sign-up"
				class="group flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30"
			>
				Ver pro meu CV real
				<ArrowRight size={14} class="transition-transform group-hover:translate-x-0.5" />
			</a>
		</div>

		<p class="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-700">
			Demo ilustrativa · IA real roda com seu CV após o cadastro
		</p>
	</div>
</section>
