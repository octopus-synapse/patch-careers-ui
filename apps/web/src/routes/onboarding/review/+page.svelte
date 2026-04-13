<script lang="ts">
	import { page } from '$app/stores';
	import { customFetch } from 'api-client';
	import { Loader2 } from 'lucide-svelte';

	const token = $derived($page.url.searchParams.get('token'));

	let reviewData = $state<Record<string, unknown> | null>(null);
	let loading = $state(true);
	let error = $state('');

	let feedback = $state('');
	let feedbackStatus = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

	$effect(() => {
		if (!token) {
			error = 'No review token provided';
			loading = false;
			return;
		}
		loadReview();
	});

	async function loadReview() {
		try {
			reviewData = await customFetch<Record<string, unknown>>(
				`/api/v1/onboarding/review/${token}`
			);
			loading = false;
		} catch {
			error = 'This review link is invalid or has expired';
			loading = false;
		}
	}

	async function sendFeedback() {
		if (!feedback.trim() || !token) return;
		feedbackStatus = 'sending';
		try {
			await customFetch(`/api/v1/onboarding/review/${token}/feedback`, {
				method: 'POST',
				body: JSON.stringify({ message: feedback })
			});
			feedbackStatus = 'sent';
			feedback = '';
		} catch {
			feedbackStatus = 'error';
		}
	}

	const personalInfo = $derived(
		(reviewData?.personalInfo as Record<string, string> | undefined) ?? {}
	);
	const professionalProfile = $derived(
		(reviewData?.professionalProfile as Record<string, string> | undefined) ?? {}
	);
	const sections = $derived(
		(reviewData?.sections as Array<Record<string, unknown>> | undefined) ?? []
	);
	const templateSelection = $derived(
		(reviewData?.templateSelection as Record<string, string> | undefined) ?? {}
	);
</script>

<svelte:head>
	<title>Resume Review</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-neutral-900">
	<div class="mx-auto max-w-2xl px-6 py-12">
		<h1
			class="text-center text-lg font-bold tracking-tight text-gray-800 dark:text-neutral-200"
		>
			Resume Review
		</h1>

		{#if loading}
			<div class="mt-20 flex justify-center">
				<Loader2 size={24} class="animate-spin text-gray-400 dark:text-neutral-500" />
			</div>
		{:else if error}
			<div class="mt-20 text-center">
				<p class="text-sm text-red-500">{error}</p>
			</div>
		{:else if reviewData}
			<div class="mt-10 space-y-8">
				<!-- Personal Info -->
				{#if Object.keys(personalInfo).length > 0}
					<section
						class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
					>
						<h2
							class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500"
						>
							Personal Information
						</h2>
						<dl class="mt-4 space-y-3">
							{#each Object.entries(personalInfo) as [key, value]}
								<div>
									<dt
										class="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-neutral-500"
									>
										{key}
									</dt>
									<dd class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">
										{value}
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/if}

				<!-- Professional Profile -->
				{#if Object.keys(professionalProfile).length > 0}
					<section
						class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
					>
						<h2
							class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500"
						>
							Professional Profile
						</h2>
						<dl class="mt-4 space-y-3">
							{#each Object.entries(professionalProfile) as [key, value]}
								<div>
									<dt
										class="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-neutral-500"
									>
										{key}
									</dt>
									<dd class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">
										{value}
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/if}

				<!-- Sections -->
				{#each sections as section}
					<section
						class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
					>
						<h2
							class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500"
						>
							{section.sectionTypeKey ?? 'Section'}
						</h2>
						{#if Array.isArray(section.items)}
							<ul class="mt-4 space-y-3">
								{#each section.items as item}
									<li
										class="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800"
									>
										{#if typeof item === 'object' && item !== null}
											{#each Object.entries(item.content ?? item) as [key, value]}
												{#if key !== 'id'}
													<p class="text-xs text-gray-700 dark:text-neutral-300">
														<span
															class="font-medium text-gray-500 dark:text-neutral-400"
															>{key}:</span
														>
														{value}
													</p>
												{/if}
											{/each}
										{:else}
											<p class="text-xs text-gray-700 dark:text-neutral-300">
												{item}
											</p>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</section>
				{/each}

				<!-- Template Choice -->
				{#if Object.keys(templateSelection).length > 0}
					<section
						class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
					>
						<h2
							class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500"
						>
							Template Choice
						</h2>
						<dl class="mt-4 space-y-3">
							{#each Object.entries(templateSelection) as [key, value]}
								<div>
									<dt
										class="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-neutral-500"
									>
										{key}
									</dt>
									<dd class="mt-0.5 text-sm text-gray-800 dark:text-neutral-200">
										{value}
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/if}

				<!-- Feedback Section -->
				<section
					class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
				>
					<h2
						class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500"
					>
						Leave Feedback
					</h2>

					{#if feedbackStatus === 'sent'}
						<p class="mt-4 text-sm text-emerald-500">
							Thank you! Your feedback has been sent.
						</p>
					{:else}
						<textarea
							bind:value={feedback}
							placeholder="Share your thoughts on this resume..."
							rows="4"
							class="mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-1 focus:ring-neutral-400 bg-white border-gray-300 text-gray-800 placeholder-gray-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-500"
						></textarea>
						<div class="mt-3 flex items-center justify-between">
							{#if feedbackStatus === 'error'}
								<span class="text-xs text-red-500"
									>Failed to send. Please try again.</span
								>
							{:else}
								<span></span>
							{/if}
							<button
								onclick={sendFeedback}
								disabled={feedbackStatus === 'sending' || !feedback.trim()}
								class="rounded-full bg-gray-900 px-5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-gray-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
							>
								{#if feedbackStatus === 'sending'}
									<Loader2
										size={13}
										class="animate-spin"
									/>
								{:else}
									Send Feedback
								{/if}
							</button>
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</div>
</div>
