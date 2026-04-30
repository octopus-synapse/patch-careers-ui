<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
/**
 * /my-profile/career-graph — "Career graph" view.
 *
 * Lets the signed-in user see where peers with a similar stack are today
 * (buckets by years of experience + top job titles) and a 3/5/10-year
 * projection based on the current cohort distribution. Zero candidate
 * identities — the backend returns aggregated histograms only.
 */
import {
  careerGraphView,
  type ViewCareerGraphDataDto,
  type ViewCareerGraphRequestDto,
} from 'api-client';
import { Sparkles, TrendingUp, Users } from 'lucide-svelte';
import { Badge, Button, Input, Label, Loader, toastState } from 'ui';

let skillsCsv = $state('');
let submitting = $state(false);
let data = $state<ViewCareerGraphDataDto | null>(null);
let searched = $state(false);

const skills = $derived(
  skillsCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

// Max bucket count for the histogram — rendered as a relative bar chart.
const maxPeerCount = $derived(
  data ? Math.max(0, ...data.buckets.map((b) => b.peerCount)) : 0,
);

async function handleSearch() {
  if (skills.length === 0 || submitting) return;
  submitting = true;
  try {
    const payload: ViewCareerGraphRequestDto = { stack: skills, maxBuckets: 20 };
    data = await careerGraphView(payload);
    searched = true;
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
        ? err.message
        : 'Falha ao calcular seu career graph';
    toastState.show(message, 'danger');
  } finally {
    submitting = false;
  }
}

function barWidth(peerCount: number): string {
  if (maxPeerCount === 0) return '0%';
  return `${Math.max(8, Math.round((peerCount / maxPeerCount) * 100))}%`;
}
</script>

<svelte:head>
	<title>Seu Career Graph · patch-careers</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-6 px-4 pb-12 pt-20">
	<header class="space-y-1">
		<div class="flex items-center gap-2 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400">
			<TrendingUp size={14} />
			Career graph
		</div>
		<h1 class="text-xl font-semibold text-gray-800 dark:text-neutral-200">
			Onde estão pessoas com seu stack hoje — e pra onde você pode ir
		</h1>
		<p class="text-sm text-gray-500 dark:text-neutral-500">
			Agregamos perfis públicos com pelo menos 60% das suas skills e mostramos por quantos anos de experiência eles estão, quais cargos ocupam, e projetamos onde você pode estar em 3, 5 e 10 anos. Nenhum nome é revelado.
		</p>
	</header>

	<section class="rounded-xl border border-gray-200 p-4 dark:border-neutral-700/60">
		<Label>Seu stack</Label>
		<Input bind:value={skillsCsv} placeholder="react, typescript, postgres, aws" />
		<p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
			Separe por vírgula. Quanto mais específico, mais útil o cohort.
		</p>
		<div class="mt-3 flex justify-end">
			<Button variant="solid" size="sm" onclick={handleSearch} disabled={skills.length === 0 || submitting}>
				{#if submitting}
					<Loader size={14} /> Calculando…
				{:else}
					<Sparkles size={14} /> Ver meu graph
				{/if}
			</Button>
		</div>
	</section>

	{#if searched && data}
		{#if data.totalPeers === 0}
			<div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-neutral-500">
				Ainda não temos peers suficientes pra esse stack específico. Tente combinações mais comuns ou volte depois — cada usuário novo ajuda.
			</div>
		{:else}
			<section class="rounded-xl border border-gray-200 p-4 dark:border-neutral-700/60">
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<Users size={14} class="text-gray-500 dark:text-neutral-400" />
					<strong>{data.totalPeers}</strong>
					<span class="text-gray-500 dark:text-neutral-400">
						peers compartilham pelo menos 60% das suas skills.
					</span>
				</div>
				<p class="mt-2 text-xs text-gray-500 dark:text-neutral-500">
					Você hoje: {data.user.experienceYears} {data.user.experienceYears === 1 ? 'ano' : 'anos'}
					{data.user.jobTitle ? ` · ${data.user.jobTitle}` : ''}.
				</p>
			</section>

			<section class="rounded-xl border border-gray-200 p-4 dark:border-neutral-700/60">
				<h2 class="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-200">Distribuição por anos de experiência</h2>
				<ol class="space-y-2">
					{#each data.buckets as b (b.experienceYears)}
						{@const isCurrent = data.current?.experienceYears === b.experienceYears}
						<li class="flex items-center gap-3">
							<span class="w-10 shrink-0 text-right text-xs font-medium text-gray-600 dark:text-neutral-400">
								{b.experienceYears}y
							</span>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<div
										class="h-5 rounded-full {isCurrent ? 'bg-violet-500 dark:bg-violet-500' : 'bg-gray-200 dark:bg-neutral-700'}"
										style="width: {barWidth(b.peerCount)};"
									></div>
									<span class="text-xs text-gray-700 dark:text-neutral-300">
										{b.peerCount} {b.peerCount === 1 ? 'peer' : 'peers'}
									</span>
									{#if isCurrent}
										<span class="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
											onde você está
										</span>
									{/if}
								</div>
								{#if b.topJobTitles.length > 0}
									<div class="mt-1 flex flex-wrap gap-1">
										{#each b.topJobTitles as t}
											<Badge intent="neutral" size="md">{t.title} · {t.count}</Badge>
										{/each}
									</div>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</section>

			<section class="rounded-xl border border-gray-200 p-4 dark:border-neutral-700/60">
				<h2 class="mb-3 text-sm font-semibold text-gray-800 dark:text-neutral-200">Se você continuar nesse stack…</h2>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{#each data.projections as p (p.yearsAhead)}
						<div class="rounded-lg border border-gray-200 p-3 dark:border-neutral-700/60">
							<p class="text-[10px] uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								Em {p.yearsAhead} {p.yearsAhead === 1 ? 'ano' : 'anos'}
							</p>
							{#if p.bucket}
								<p class="mt-1 text-sm font-semibold text-gray-800 dark:text-neutral-200">
									{p.bucket.experienceYears}y · {p.bucket.peerCount} peers
								</p>
								<div class="mt-2 flex flex-wrap gap-1">
									{#each p.bucket.topJobTitles as t}
										<span class="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
											{t.title}
										</span>
									{/each}
								</div>
							{:else}
								<p class="mt-1 text-xs text-gray-400 dark:text-neutral-500">Sem dados suficientes.</p>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</main>
