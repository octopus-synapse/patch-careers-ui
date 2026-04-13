<script lang="ts">
	import { Input, Button } from 'ui';
	import { customFetch } from 'api-client';
	import { Check, Minus, Send } from 'lucide-svelte';

	type StepDef = {
		id: string;
		label: string;
		fields?: Array<{ key: string; label: string }>;
		data?: Array<{ id: string; name: string; thumbnailUrl?: string | null }>;
	};

	type Props = {
		session: Record<string, unknown>;
		steps: StepDef[];
		completedSteps: string[];
		ongoto: (stepId: string) => void;
	};

	let { session, steps, completedSteps, ongoto }: Props = $props();

	let shareEmail = $state('');
	let shareStatus = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

	async function sendReviewInvite() {
		if (!shareEmail.trim()) return;
		shareStatus = 'sending';
		try {
			await customFetch('/api/v1/onboarding/review/invite', {
				method: 'POST',
				body: JSON.stringify({ email: shareEmail }),
			});
			shareStatus = 'sent';
			shareEmail = '';
		} catch {
			shareStatus = 'error';
		}
	}

	type ReviewEntry = { label: string; value: string; long?: boolean };
	type ReviewSection = { label: string; stepId: string; entries: ReviewEntry[]; skipped?: boolean; themePreview?: string | null; themeName?: string };

	const sections = $derived.by(() => {
		const result: ReviewSection[] = [];

		const pi = session.personalInfo as Record<string, string> | undefined;
		if (pi) {
			const step = steps.find((s) => s.id === 'personal-info');
			const entries = (step?.fields ?? [])
				.filter((f) => pi[f.key])
				.map((f) => ({ label: f.label, value: String(pi[f.key]) }));
			if (entries.length) result.push({ label: step?.label ?? 'Personal Info', stepId: 'personal-info', entries });
		}

		const username = session.username as string | undefined;
		if (username) {
			const step = steps.find((s) => s.id === 'username');
			result.push({ label: step?.label ?? 'Username', stepId: 'username', entries: [{ label: '', value: `@${username}` }] });
		}

		const pp = session.professionalProfile as Record<string, string> | undefined;
		if (pp) {
			const step = steps.find((s) => s.id === 'professional-profile');
			const entries = (step?.fields ?? [])
				.filter((f) => pp[f.key])
				.map((f) => ({
					label: f.label,
					value: String(pp[f.key]),
					long: f.key === 'summary',
				}));
			if (entries.length) result.push({ label: step?.label ?? 'Profile', stepId: 'professional-profile', entries });
		}

		const secs = session.sections as Array<{
			sectionTypeKey: string;
			items?: Array<{ content?: Record<string, unknown> }>;
			noData?: boolean;
		}> | undefined;
		if (secs) {
			for (const sec of secs) {
				const step = steps.find((s) => s.id === `section:${sec.sectionTypeKey}`);
				const label = step?.label ?? sec.sectionTypeKey;

				const stepId = `section:${sec.sectionTypeKey}`;
				if (sec.noData || !sec.items?.length) {
					result.push({ label, stepId, entries: [], skipped: true });
					continue;
				}

				const entries = sec.items.map((item) => {
					const vals = Object.values(item.content ?? {}).filter(Boolean);
					return { label: '', value: vals.slice(0, 3).join(' · ') || '---' };
				});
				result.push({ label, stepId, entries });
			}
		}

		const ts = session.templateSelection as Record<string, string> | undefined;
		if (ts?.templateId) {
			const step = steps.find((s) => s.id === 'template');
			const themeData = step?.data?.find((t) => t.id === ts.templateId);
			result.push({
				label: step?.label ?? 'Theme',
				stepId: 'template',
				entries: [],
				themeName: themeData?.name ?? ts.templateId,
				themePreview: themeData?.thumbnailUrl,
			});
		}

		return result;
	});
</script>

<div class="space-y-3">
	<!-- Share for review -->
	<div class="flex items-center gap-2 rounded-lg border border-dashed p-3 border-gray-300 dark:border-neutral-600">
		<Send size={14} class="flex-shrink-0 text-gray-400 dark:text-neutral-500" />
		<Input
			type="email"
			bind:value={shareEmail}
			placeholder="Email to share for review"
		/>
		<Button
			variant="ghost"
			size="xs"
			onclick={sendReviewInvite}
			disabled={shareStatus === 'sending' || !shareEmail.trim()}
		>
			{shareStatus === 'sending' ? 'Sending...' : 'Send'}
		</Button>
	</div>
	{#if shareStatus === 'sent'}
		<p class="text-center text-xs text-emerald-500">Invite sent!</p>
	{:else if shareStatus === 'error'}
		<p class="text-center text-xs text-red-500">Failed to send. Try again.</p>
	{/if}

	{#each sections as section}
		<button
			onclick={() => ongoto(section.stepId)}
			class="w-full cursor-pointer rounded-lg border p-5 text-left transition-colors {section.skipped ? 'bg-gray-50 dark:bg-neutral-800/30' : 'bg-white dark:bg-neutral-800/50'} border-gray-200 dark:border-neutral-700/50 hover:border-gray-400 dark:hover:border-neutral-500"
		>
			<div class="mb-3 flex items-center gap-2">
				{#if section.skipped}
					<Minus size={12} class="text-gray-500 dark:text-neutral-500" />
				{:else}
					<Check size={12} class="text-emerald-500" />
				{/if}
				<h3 class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{section.label}
				</h3>
			</div>

			{#if section.skipped}
				<p class="text-xs italic text-gray-500 dark:text-neutral-500">Skipped</p>
			{:else if section.themePreview || section.themeName}
				<div class="flex items-start gap-4">
					{#if section.themePreview}
						<img
							src={section.themePreview}
							alt={section.themeName}
							class="w-20 rounded border border-gray-200 dark:border-neutral-700/50"
							loading="lazy"
						/>
					{/if}
					<span class="text-xs font-medium text-gray-800 dark:text-neutral-200">{section.themeName}</span>
				</div>
			{:else}
				<dl class="space-y-2">
					{#each section.entries as entry}
						{#if entry.long}
							<div>
								{#if entry.label}
									<dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{entry.label}</dt>
								{/if}
								<dd class="text-xs leading-relaxed break-words text-gray-800 dark:text-neutral-200">{entry.value}</dd>
							</div>
						{:else}
							<div class="flex items-baseline justify-between gap-4">
								{#if entry.label}
									<dt class="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{entry.label}</dt>
								{/if}
								<dd class="text-right text-xs text-gray-800 dark:text-neutral-200">{entry.value}</dd>
							</div>
						{/if}
					{/each}
				</dl>
			{/if}
		</button>
	{/each}
</div>
