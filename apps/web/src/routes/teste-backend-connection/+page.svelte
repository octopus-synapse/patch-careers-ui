<script lang="ts">
	import { browser } from '$app/environment';
	import { customFetch, getBaseUrl } from 'api-client';

	let results = $state<Array<{ endpoint: string; status: string; data: string; time: number }>>([]);
	let testing = $state(false);

	const endpoints = [
		{ name: 'Health (raw fetch)', url: '/health', raw: true },
		{ name: 'Auth Session', url: '/api/auth/session', raw: false },
		{ name: 'Social Stats (public)', url: '/api/v1/users/me/social-stats', raw: false },
		{ name: 'Network Summary', url: '/api/v1/users/me/network-summary', raw: false },
		{ name: 'Connection Suggestions', url: '/api/v1/users/me/connections/suggestions', raw: false },
	];

	async function runTests() {
		if (!browser) return;
		testing = true;
		results = [];

		const baseUrl = getBaseUrl();
		results = [...results, { endpoint: 'Base URL', status: 'info', data: baseUrl, time: 0 }];

		for (const ep of endpoints) {
			const start = performance.now();
			try {
				if (ep.raw) {
					const res = await fetch(`${baseUrl}${ep.url}`, { credentials: 'include' });
					const body = await res.text();
					results = [...results, {
						endpoint: ep.name,
						status: res.ok ? 'ok' : `${res.status}`,
						data: body.slice(0, 200),
						time: Math.round(performance.now() - start),
					}];
				} else {
					const data = await customFetch<unknown>(ep.url);
					results = [...results, {
						endpoint: ep.name,
						status: 'ok',
						data: JSON.stringify(data).slice(0, 200),
						time: Math.round(performance.now() - start),
					}];
				}
			} catch (err) {
				const e = err as Record<string, unknown>;
				results = [...results, {
					endpoint: ep.name,
					status: `error ${e.statusCode ?? ''}`.trim(),
					data: e.message ? String(e.message) : JSON.stringify(e).slice(0, 200),
					time: Math.round(performance.now() - start),
				}];
			}
		}
		testing = false;
	}
</script>

<svelte:head>
	<title>Backend Connection Test</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-neutral-900">
	<div class="mx-auto max-w-2xl px-6">
		<h1 class="text-lg font-bold text-gray-800 dark:text-neutral-200 mb-4">Backend Connection Test</h1>

		<button
			onclick={runTests}
			disabled={testing}
			class="mb-6 rounded-lg px-4 py-2 text-sm font-semibold bg-gray-800 text-white hover:bg-gray-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 disabled:opacity-50"
		>
			{testing ? 'Testing...' : 'Run Tests'}
		</button>

		{#if results.length > 0}
			<div class="space-y-3">
				{#each results as r}
					<div class="rounded-lg border p-4 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
						<div class="flex items-center justify-between mb-1">
							<span class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{r.endpoint}</span>
							<div class="flex items-center gap-2">
								{#if r.time > 0}
									<span class="text-[10px] text-gray-400 dark:text-neutral-500">{r.time}ms</span>
								{/if}
								<span class="rounded px-2 py-0.5 text-[10px] font-bold uppercase
									{r.status === 'ok' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
									 r.status === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
									 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">
									{r.status}
								</span>
							</div>
						</div>
						<pre class="text-[11px] text-gray-500 dark:text-neutral-400 whitespace-pre-wrap break-all">{r.data}</pre>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
