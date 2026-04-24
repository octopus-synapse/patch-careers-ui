<script lang="ts">
import { getBaseUrl } from 'api-client';
import { Check, FlaskConical, Loader2, Play, X } from 'lucide-svelte';
import { Button } from 'ui';

// Dev-tool: kept on plain `fetch()` because the generated `testRunnerRunTests`
// hook doesn't yet carry the `{ suite }` body (backend decorator missing
// @ApiBody). When the backend annotates it and orval picks it up, swap this
// for the generated mutation.

interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
  durationMs: number;
}

interface TestResults {
  suite: string;
  results: TestResult[];
  totalMs: number;
  passed: number;
  failed: number;
}

const suites = [
  {
    id: 'seed-check',
    name: 'Seed Check',
    description: 'Verifica seeds no banco (skills, sections, onboarding steps, languages)',
  },
  {
    id: 'auth-flow',
    name: 'Auth Flow',
    description: 'Cria user temporário → login → session → cleanup',
  },
  {
    id: 'social-crud',
    name: 'Social CRUD',
    description: 'Follow/unfollow + connection request/accept/remove com dados temporários',
  },
  {
    id: 'onboarding-resume',
    name: 'Onboarding & Resume',
    description: 'Cria user → resume → verifica → cleanup',
  },
];

let results = $state<Record<string, TestResults | null>>({});
let running = $state<Record<string, boolean>>({});

const runningAll = $derived(Object.values(running).some(Boolean));

async function runSuite(suiteId: string) {
  running[suiteId] = true;
  results[suiteId] = null;

  try {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/test/run`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite: suiteId }),
    });
    if (!res.ok) throw new Error(await res.text());
    const body = (await res.json()) as { data?: TestResults } | TestResults;
    results[suiteId] = ('data' in body ? body.data : body) as TestResults;
  } catch (err) {
    const e = err as Record<string, unknown>;
    results[suiteId] = {
      suite: suiteId,
      results: [
        {
          name: 'Request failed',
          pass: false,
          detail: e.message ? String(e.message) : 'Unknown error',
          durationMs: 0,
        },
      ],
      totalMs: 0,
      passed: 0,
      failed: 1,
    };
  } finally {
    running[suiteId] = false;
  }
}

async function runAll() {
  await Promise.all(suites.map((s) => runSuite(s.id)));
}
</script>

<svelte:head>
	<title>Test Runner</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<FlaskConical size={20} class="text-gray-500 dark:text-neutral-500" />
			<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
				Test Runner
			</h1>
		</div>
		<Button variant="solid" size="sm" onclick={runAll} disabled={runningAll}>
			{#if runningAll}
				<Loader2 size={14} class="animate-spin" />
				Running...
			{:else}
				<Play size={14} />
				Run All
			{/if}
		</Button>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		{#each suites as suite}
			{@const suiteResults = results[suite.id]}
			{@const isRunning = running[suite.id] ?? false}

			<div
				class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
							{suite.name}
						</h2>
						<p class="mt-0.5 text-xs text-gray-500 dark:text-neutral-500">
							{suite.description}
						</p>
					</div>
					<Button variant="outline" size="xs" onclick={() => runSuite(suite.id)} disabled={isRunning} class="shrink-0">
						{#if isRunning}
							<Loader2 size={12} class="animate-spin" />
							Running
						{:else}
							<Play size={12} />
							Run
						{/if}
					</Button>
				</div>

				{#if isRunning && !suiteResults}
					<div class="mt-4 flex items-center justify-center py-6">
						<Loader2 size={20} class="animate-spin text-gray-400 dark:text-neutral-500" />
					</div>
				{/if}

				{#if suiteResults}
					<div class="mt-4 space-y-2">
						{#each suiteResults.results as test}
							<div
								class="flex items-start gap-2.5 rounded-lg px-3 py-2 {test.pass
									? 'bg-emerald-50 dark:bg-emerald-900/10'
									: 'bg-red-50 dark:bg-red-900/10'}"
							>
								<div class="mt-0.5 shrink-0">
									{#if test.pass}
										<Check
											size={14}
											class="text-emerald-600 dark:text-emerald-300"
										/>
									{:else}
										<X size={14} class="text-red-600 dark:text-red-400" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<span
										class="text-xs font-medium {test.pass
											? 'text-emerald-800 dark:text-emerald-300'
											: 'text-red-800 dark:text-red-300'}"
									>
										{test.name}
									</span>
									{#if test.detail}
										<p
											class="mt-0.5 text-[10px] {test.pass
												? 'text-emerald-600/70 dark:text-emerald-400/60'
												: 'text-red-600/70 dark:text-red-400/60'}"
										>
											{test.detail}
										</p>
									{/if}
								</div>
								<span
									class="shrink-0 text-[10px] tabular-nums {test.pass
										? 'text-emerald-500/70 dark:text-emerald-400/50'
										: 'text-red-500/70 dark:text-red-400/50'}"
								>
									{test.durationMs}ms
								</span>
							</div>
						{/each}
					</div>

					<div
						class="mt-3 flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 dark:bg-neutral-700/30"
					>
						<span class="text-xs font-medium text-gray-600 dark:text-neutral-400">
							<span class="text-emerald-600 dark:text-emerald-300"
								>{suiteResults.passed} passed</span
							>,
							<span
								class={suiteResults.failed > 0
									? 'text-red-600 dark:text-red-400'
									: 'text-gray-500 dark:text-neutral-500'}
								>{suiteResults.failed} failed</span
							>
						</span>
						<span
							class="text-[10px] tabular-nums text-gray-500 dark:text-neutral-500"
						>
							{suiteResults.totalMs}ms
						</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
