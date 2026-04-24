<script lang="ts">
import { ArrowRight, Mail, MapPin, Github, Check, X } from 'lucide-svelte';
import { fade } from 'svelte/transition';

/** Pre-scripted demo: the same candidate, one base CV rendered in three
 *  ATS-aware variants. The landing does not hit the backend — we show the
 *  shape of the outcome, animated, so visitors feel the "tailored for this
 *  job" mechanic before they sign up. */
type Segment = { text: string; hot?: boolean };
type Bullet = Segment[];

type Role = {
  title: string;
  company: string;
  period: string;
  bullets: Bullet[];
};

type Version = {
  slug: string;
  label: string;
  target: string;
  summary: Bullet;
  roles: Role[];
  skills: { text: string; hot?: boolean }[];
  ats: {
    score: number;
    detected: string[];
    missing: string[];
  };
};

const candidate = {
  name: 'Júlia Prado',
  email: 'julia.prado@mail.com',
  location: 'São Paulo · Remote',
  github: 'github.com/juliaprado',
};

const versions: Version[] = [
  {
    slug: 'original',
    label: 'Original',
    target: 'Sem vaga &mdash; currículo genérico',
    summary: [
      { text: 'Engenheira de software com 8 anos de experiência em desenvolvimento de aplicações, boas práticas e times multifuncionais.' },
    ],
    roles: [
      {
        title: 'Senior Software Engineer',
        company: 'Nubank',
        period: '2022 &mdash; Atual',
        bullets: [
          [{ text: 'Desenvolveu serviços de backend usados por milhões de usuários.' }],
          [{ text: 'Trabalhou com o time em melhorias contínuas na plataforma.' }],
          [{ text: 'Participou de code reviews e mentoria de juniores.' }],
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Loft',
        period: '2019 &mdash; 2022',
        bullets: [
          [{ text: 'Desenvolveu aplicações web para o produto principal.' }],
          [{ text: 'Colaborou com o time de produto na definição de features.' }],
        ],
      },
    ],
    skills: [
      { text: 'Programação' },
      { text: 'Backend' },
      { text: 'APIs' },
      { text: 'Cloud' },
      { text: 'Ágil' },
      { text: 'Git' },
    ],
    ats: {
      score: 42,
      detected: ['software', 'backend', 'cloud', 'apis'],
      missing: ['Rust', 'Tokio', 'gRPC', 'observability', 'SRE'],
    },
  },
  {
    slug: 'rust-vercel',
    label: 'Vercel · Rust',
    target: 'Senior Rust Backend Engineer &mdash; Vercel',
    summary: [
      { text: 'Engenheira backend com ' },
      { text: '8 anos focados em sistemas de alta performance', hot: true },
      { text: ' em Rust e infraestrutura distribuída. Experiência com p99 sub-150ms em cargas de produção.' },
    ],
    roles: [
      {
        title: 'Senior Software Engineer',
        company: 'Nubank',
        period: '2022 &mdash; Atual',
        bullets: [
          [
            { text: 'Projetou microsserviços em ' },
            { text: 'Rust', hot: true },
            { text: ' com ' },
            { text: 'Tokio/Axum', hot: true },
            { text: ' servindo ' },
            { text: '45k req/s', hot: true },
            { text: ' com ' },
            { text: 'p99 < 120ms', hot: true },
            { text: '.' },
          ],
          [
            { text: 'Implementou ' },
            { text: 'observabilidade', hot: true },
            { text: ' em ' },
            { text: 'OpenTelemetry', hot: true },
            { text: ', reduzindo MTTR em ' },
            { text: '58%', hot: true },
            { text: '.' },
          ],
          [
            { text: 'Reduziu custo de infra em ' },
            { text: '38%', hot: true },
            { text: ' migrando de Go para Rust com tuning de alocação de memória.' },
          ],
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Loft',
        period: '2019 &mdash; 2022',
        bullets: [
          [
            { text: 'Desenvolveu ' },
            { text: 'APIs gRPC', hot: true },
            { text: ' em Rust para o core de busca imobiliária.' },
          ],
          [
            { text: 'Contribuiu em arquitetura com ' },
            { text: 'event sourcing', hot: true },
            { text: ' e ' },
            { text: 'CQRS', hot: true },
            { text: '.' },
          ],
        ],
      },
    ],
    skills: [
      { text: 'Rust', hot: true },
      { text: 'Tokio', hot: true },
      { text: 'gRPC', hot: true },
      { text: 'OpenTelemetry', hot: true },
      { text: 'SRE', hot: true },
      { text: 'PostgreSQL' },
      { text: 'Kafka' },
    ],
    ats: {
      score: 94,
      detected: ['Rust', 'Tokio', 'Axum', 'gRPC', 'p99', 'OpenTelemetry', 'microservices'],
      missing: ['Kubernetes'],
    },
  },
  {
    slug: 'data-ifood',
    label: 'iFood · Data',
    target: 'Staff Data Engineer &mdash; iFood',
    summary: [
      { text: 'Engenheira de dados com ' },
      { text: '8 anos construindo pipelines em larga escala', hot: true },
      { text: ' em Databricks e arquiteturas real-time. Forte em Spark, Airflow e observabilidade de dados.' },
    ],
    roles: [
      {
        title: 'Senior Software Engineer',
        company: 'Nubank',
        period: '2022 &mdash; Atual',
        bullets: [
          [
            { text: 'Construiu pipelines em ' },
            { text: 'Databricks + Spark', hot: true },
            { text: ' processando ' },
            { text: '4TB/dia', hot: true },
            { text: ' para analytics ' },
            { text: 'real-time', hot: true },
            { text: '.' },
          ],
          [
            { text: 'Implementou ' },
            { text: 'CDC', hot: true },
            { text: ' com ' },
            { text: 'Debezium + Kafka', hot: true },
            { text: ' para sincronização cross-region.' },
          ],
          [
            { text: 'Migrou ETL legado para ' },
            { text: 'Airflow', hot: true },
            { text: ' em ' },
            { text: 'AWS', hot: true },
            { text: ' com ' },
            { text: '52%', hot: true },
            { text: ' de redução no tempo de processamento.' },
          ],
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Loft',
        period: '2019 &mdash; 2022',
        bullets: [
          [
            { text: 'Desenvolveu ' },
            { text: 'dashboards analíticos', hot: true },
            { text: ' com ' },
            { text: 'dbt + Snowflake', hot: true },
            { text: ' para decisões de produto.' },
          ],
          [
            { text: 'Automatizou ingestão de eventos com ' },
            { text: 'Python + SQL', hot: true },
            { text: ' em escala.' },
          ],
        ],
      },
    ],
    skills: [
      { text: 'Databricks', hot: true },
      { text: 'Spark', hot: true },
      { text: 'Airflow', hot: true },
      { text: 'Kafka', hot: true },
      { text: 'Python', hot: true },
      { text: 'SQL', hot: true },
      { text: 'AWS' },
    ],
    ats: {
      score: 91,
      detected: ['Databricks', 'Spark', 'Airflow', 'Kafka', 'Python', 'SQL', 'ETL', 'real-time'],
      missing: ['Snowflake (parcial)'],
    },
  },
];

let selectedSlug = $state('original');
const selected = $derived(versions.find((v) => v.slug === selectedSlug) ?? versions[0]);

// Animated ATS score tween — ticks up/down on version change.
let displayScore = $state(42);
let scoreTimer: ReturnType<typeof setInterval> | null = null;

function tweenScore(target: number) {
  if (scoreTimer) clearInterval(scoreTimer);
  scoreTimer = setInterval(() => {
    if (displayScore === target) {
      clearInterval(scoreTimer!);
      scoreTimer = null;
      return;
    }
    const diff = target - displayScore;
    const step = Math.abs(diff) > 6 ? Math.sign(diff) * 2 : Math.sign(diff);
    displayScore = Math.max(0, Math.min(100, displayScore + step));
  }, 18);
}

function selectVersion(slug: string) {
  if (slug === selectedSlug) return;
  selectedSlug = slug;
  const v = versions.find((v) => v.slug === slug) ?? versions[0];
  tweenScore(v.ats.score);
}

// Auto-cycle through versions so first-time visitors see the mechanic.
let autoCycle = $state(true);
$effect(() => {
  if (!autoCycle) return;
  const order = ['original', 'rust-vercel', 'data-ifood'];
  const cycle = setInterval(() => {
    const current = order.indexOf(selectedSlug);
    const next = order[(current + 1) % order.length];
    selectVersion(next);
  }, 4800);
  return () => clearInterval(cycle);
});

function pauseAuto(slug: string) {
  autoCycle = false;
  selectVersion(slug);
}
</script>

<section class="relative px-6 py-24 sm:px-10 sm:py-32 md:py-40 lg:px-16" style="background: var(--landing-ink);">
	<div class="mx-auto max-w-[1400px]">
		<!-- Section masthead — matches § 02 / § 03 pattern -->
		<div class="mb-14 flex flex-col gap-4 border-b pb-10 sm:flex-row sm:items-end sm:justify-between" style="border-color: var(--landing-line-dark)">
			<div>
				<p class="mb-4 font-mono text-[11px] uppercase tracking-[0.24em]" style="color: var(--landing-oxide)">
					§ 01 &mdash; Demo
				</p>
				<h2 class="font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-[6rem]">
					Um currículo. <span class="font-display-italic" style="color: var(--landing-oxide)">Reescrito</span> pra cada vaga.
				</h2>
			</div>
			<p class="max-w-sm font-mono text-xs uppercase leading-relaxed tracking-[0.14em]" style="color: var(--landing-muted-on-ink)">
				Mesma candidata. Três versões. O ATS enxerga a diferença.
			</p>
		</div>

		<!-- Version tabs — square, mono, shared border like the scenario strip -->
		<div class="mb-8 grid gap-0 border sm:grid-cols-3" style="border-color: var(--landing-line-dark)">
			{#each versions as v, i (v.slug)}
				{@const active = v.slug === selectedSlug}
				<button
					type="button"
					onclick={() => pauseAuto(v.slug)}
					class="flex flex-col gap-1.5 px-5 py-4 text-left transition-colors {i > 0 ? 'border-t sm:border-l sm:border-t-0' : ''}"
					style="border-color: var(--landing-line-dark); background: {active ? 'var(--landing-ink-2)' : 'transparent'};"
				>
					<span class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]" style="color: {active ? 'var(--landing-oxide)' : 'var(--landing-muted-on-ink)'};">
						{#if active}
							<span class="h-1 w-1 rounded-full" style="background: var(--landing-oxide)"></span>
						{/if}
						Versão {String(i + 1).padStart(2, '0')} &mdash; {v.label}
					</span>
					<span class="font-display text-xl leading-tight" style="color: {active ? 'var(--landing-text-on-ink)' : 'var(--landing-muted-on-ink)'};">
						{@html v.target}
					</span>
				</button>
			{/each}
		</div>

		<!-- CV paper (left 2fr) · ATS scan (right 1fr) -->
		<div class="grid grid-cols-1 gap-0 border lg:grid-cols-[2fr_1fr]" style="border-color: var(--landing-line-dark)">
			<!-- ░░░ CV PAPER ░░░ -->
			<article class="relative p-6 sm:p-10 md:p-12" style="background: var(--landing-paper); color: var(--landing-text-on-paper);">
				<!-- Decorative corner marks echo the pricing card -->
				<span class="absolute left-0 top-0 h-3 w-3 border-l border-t" style="border-color: var(--landing-oxide-ink)"></span>
				<span class="absolute right-0 top-0 h-3 w-3 border-r border-t" style="border-color: var(--landing-oxide-ink)"></span>
				<span class="absolute bottom-0 left-0 h-3 w-3 border-b border-l" style="border-color: var(--landing-oxide-ink)"></span>
				<span class="absolute bottom-0 right-0 h-3 w-3 border-b border-r" style="border-color: var(--landing-oxide-ink)"></span>

				<!-- Header -->
				<header class="mb-8">
					<div class="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-paper)">
						<span>Currículo · PDF</span>
						<span>Página 1 / 1</span>
					</div>
					<h3 class="font-display text-4xl leading-[0.95] sm:text-5xl md:text-6xl" style="color: var(--landing-text-on-paper)">
						{candidate.name}
					</h3>
					<div class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.14em]" style="color: var(--landing-muted-on-paper)">
						<span class="inline-flex items-center gap-1.5">
							<Mail size={11} />
							{candidate.email}
						</span>
						<span class="inline-flex items-center gap-1.5">
							<MapPin size={11} />
							{candidate.location}
						</span>
						<span class="inline-flex items-center gap-1.5">
							<Github size={11} />
							{candidate.github}
						</span>
					</div>
				</header>

				<!-- Summary -->
				<section class="mb-8 border-t pt-6" style="border-color: var(--landing-line-light)">
					<p class="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-oxide-ink)">
						Resumo
					</p>
					{#key selected.slug + '-summary'}
						<p in:fade|local={{ duration: 260 }} class="font-display text-xl leading-snug sm:text-2xl" style="color: var(--landing-text-on-paper)">
							{#each selected.summary as seg (seg.text)}
								{#if seg.hot}
									<span class="font-display-italic" style="color: var(--landing-oxide-ink)">{seg.text}</span>
								{:else}
									<span>{seg.text}</span>
								{/if}
							{/each}
						</p>
					{/key}
				</section>

				<!-- Experience -->
				<section class="mb-8 border-t pt-6" style="border-color: var(--landing-line-light)">
					<p class="mb-5 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-oxide-ink)">
						Experiência
					</p>
					<div class="space-y-8">
						{#each selected.roles as role, ri (selected.slug + '-' + ri)}
							<div>
								<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
									<div>
										<h4 class="font-display text-xl leading-tight" style="color: var(--landing-text-on-paper)">
											{role.title}
										</h4>
										<p class="font-mono text-[11px] uppercase tracking-[0.18em]" style="color: var(--landing-muted-on-paper)">
											{role.company}
										</p>
									</div>
									<span class="font-mono text-[10px] uppercase tracking-[0.2em]" style="color: var(--landing-muted-on-paper)">
										{@html role.period}
									</span>
								</div>
								<ul class="space-y-2.5">
									{#each role.bullets as bullet, bi (selected.slug + '-' + ri + '-' + bi)}
										<li in:fade|local={{ duration: 240, delay: 60 + bi * 50 }} class="flex gap-3 text-[15px] leading-relaxed" style="color: var(--landing-text-on-paper)">
											<span class="mt-[9px] h-px w-3 shrink-0" style="background: var(--landing-oxide-ink)"></span>
											<span>
												{#each bullet as seg, si (si)}
													{#if seg.hot}
														<span class="font-medium" style="color: var(--landing-oxide-ink); background: var(--landing-oxide-tint); padding: 0 3px;">{seg.text}</span>
													{:else}
														<span>{seg.text}</span>
													{/if}
												{/each}
											</span>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				</section>

				<!-- Skills -->
				<section class="mb-4 border-t pt-6" style="border-color: var(--landing-line-light)">
					<p class="mb-4 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-oxide-ink)">
						Skills
					</p>
					{#key selected.slug + '-skills'}
						<div in:fade|local={{ duration: 220 }} class="flex flex-wrap gap-2">
							{#each selected.skills as skill (skill.text)}
								<span
									class="border px-2.5 py-1 font-mono text-[11px]"
									style="border-color: {skill.hot ? 'var(--landing-oxide-ink)' : 'var(--landing-line-light)'}; color: {skill.hot ? 'var(--landing-oxide-ink)' : 'var(--landing-muted-on-paper)'}; background: {skill.hot ? 'var(--landing-oxide-tint)' : 'transparent'};"
								>
									{skill.text}
								</span>
							{/each}
						</div>
					{/key}
				</section>

				<!-- Education (static, always the same) -->
				<section class="border-t pt-6" style="border-color: var(--landing-line-light)">
					<p class="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-oxide-ink)">
						Formação
					</p>
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<div>
							<h4 class="font-display text-lg leading-tight" style="color: var(--landing-text-on-paper)">
								Bacharelado em Ciência da Computação
							</h4>
							<p class="font-mono text-[11px] uppercase tracking-[0.18em]" style="color: var(--landing-muted-on-paper)">
								USP &mdash; São Paulo
							</p>
						</div>
						<span class="font-mono text-[10px] uppercase tracking-[0.2em]" style="color: var(--landing-muted-on-paper)">
							2015 &mdash; 2019
						</span>
					</div>
				</section>
			</article>

			<!-- ░░░ ATS SCAN PANEL ░░░ -->
			<aside class="relative flex flex-col gap-6 p-6 sm:p-8" style="background: var(--landing-ink-2); border-top: 1px solid var(--landing-line-dark);">
				<div class="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
					<span class="inline-flex items-center gap-1.5">
						<span class="h-1 w-1 rounded-full" style="background: var(--landing-oxide)"></span>
						ATS Scan
					</span>
					<span>Live</span>
				</div>

				<!-- Target job -->
				<div>
					<p class="font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						Vaga alvo
					</p>
					{#key selected.slug + '-target'}
						<p in:fade|local={{ duration: 220 }} class="mt-1.5 font-display text-xl leading-tight" style="color: var(--landing-text-on-ink)">
							{@html selected.target}
						</p>
					{/key}
				</div>

				<!-- Score dial -->
				<div class="border-t border-b py-5" style="border-color: var(--landing-line-dark)">
					<div class="flex items-baseline justify-between">
						<span class="font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
							Match score
						</span>
						<span class="font-display tabular-nums" style="color: {displayScore >= 80 ? 'var(--landing-oxide)' : 'var(--landing-muted-on-ink)'}; font-size: 2.75rem; line-height: 1;">
							{displayScore}<span class="text-lg" style="color: var(--landing-muted-on-ink)">%</span>
						</span>
					</div>
					<div class="mt-3 h-[2px] w-full" style="background: var(--landing-line-dark)">
						<div
							class="h-full"
							style="width: {displayScore}%; background: {displayScore >= 80 ? 'var(--landing-oxide)' : 'var(--landing-muted-on-ink)'}; transition: width 180ms var(--ease-precise), background 180ms var(--ease-precise);"
						></div>
					</div>
					<p class="mt-3 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						{#if displayScore >= 80}Passa na triagem{:else if displayScore >= 60}Triagem parcial{:else}Alta chance de descarte{/if}
					</p>
				</div>

				<!-- Detected keywords -->
				<div>
					<p class="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-oxide)">
						<Check size={11} />
						Detectado ({selected.ats.detected.length})
					</p>
					{#key selected.slug + '-detected'}
						<ul in:fade|local={{ duration: 220 }} class="flex flex-wrap gap-1.5">
							{#each selected.ats.detected as kw (kw)}
								<li class="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]" style="border-color: var(--landing-oxide); color: var(--landing-oxide);">
									{kw}
								</li>
							{/each}
						</ul>
					{/key}
				</div>

				<!-- Missing keywords -->
				<div>
					<p class="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						<X size={11} />
						Não detectado ({selected.ats.missing.length})
					</p>
					{#key selected.slug + '-missing'}
						<ul in:fade|local={{ duration: 220 }} class="flex flex-wrap gap-1.5">
							{#each selected.ats.missing as kw (kw)}
								<li class="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]" style="border-color: var(--landing-line-dark); color: var(--landing-muted-on-ink);">
									{kw}
								</li>
							{/each}
						</ul>
					{/key}
				</div>

				<!-- Auto-cycle status -->
				<div class="mt-auto border-t pt-4 font-mono text-[10px] uppercase tracking-[0.22em]" style="border-color: var(--landing-line-dark); color: var(--landing-muted-on-ink);">
					{#if autoCycle}
						<span class="inline-flex items-center gap-2">
							<span class="h-1 w-1 animate-pulse rounded-full" style="background: var(--landing-oxide)"></span>
							Auto &mdash; clique numa versão p/ parar
						</span>
					{:else}
						<span>Versão fixada &mdash; clique outra p/ comparar</span>
					{/if}
				</div>
			</aside>
		</div>

		<!-- Footer CTA -->
		<div class="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
			<p class="font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
				Demo ilustrativa &nbsp;·&nbsp; no produto, a IA roda sobre o seu currículo real
			</p>
			<a
				href="/identity/sign-up"
				class="group inline-flex items-center gap-3 px-7 py-4 text-sm font-medium transition-colors"
				style="background: var(--landing-oxide); color: var(--landing-ink); transition-duration: var(--dur-tight); transition-timing-function: var(--ease-precise);"
				onmouseenter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'var(--landing-oxide-ink)')}
				onmouseleave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'var(--landing-oxide)')}
			>
				<span>Ver no meu currículo real</span>
				<ArrowRight size={16} class="transition-transform duration-200 group-hover:translate-x-1" />
			</a>
		</div>
	</div>
</section>
