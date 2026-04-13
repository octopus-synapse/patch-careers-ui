<script lang="ts">
	import { Modal, Button, Input } from 'ui';
	import { Loader2, Plus, X, Image, Link } from 'lucide-svelte';
	import { postsCreate } from 'api-client';

	type Props = {
		open: boolean;
		oncreate: () => void;
		oncancel: () => void;
	};

	let { open, oncreate, oncancel }: Props = $props();

	const postTypes = ['ACHIEVEMENT', 'OPPORTUNITY', 'LEARNING', 'BUILD', 'QUESTION'] as const;
	type PostType = typeof postTypes[number];

	let step = $state<1 | 2>(1);
	let selectedType = $state<PostType>('ACHIEVEMENT');
	let content = $state('');
	let hardSkillsInput = $state('');
	let softSkillsInput = $state('');
	let linkUrl = $state('');
	let imageUrl = $state('');
	let submitting = $state(false);

	// ACHIEVEMENT fields
	let achTitle = $state('');
	let achOrganization = $state('');
	let achDate = $state('');
	let achDescription = $state('');

	// OPPORTUNITY fields
	let oppDescription = $state('');
	let oppSkillsRequired = $state('');
	let oppCommitment = $state('');
	let oppContactMethod = $state('');

	// LEARNING fields
	let learnInsight = $state('');
	let learnApplication = $state('');
	let learnSkills = $state('');

	// BUILD fields
	let buildTitle = $state('');
	let buildDescription = $state('');
	let buildProjectUrl = $state('');
	let buildDecision = $state('');

	// QUESTION fields
	let questionText = $state('');
	let questionOptions = $state<string[]>(['', '']);
	let questionContext = $state('');

	function resetForm() {
		step = 1;
		selectedType = 'ACHIEVEMENT';
		content = '';
		hardSkillsInput = '';
		softSkillsInput = '';
		linkUrl = '';
		imageUrl = '';
		achTitle = '';
		achOrganization = '';
		achDate = '';
		achDescription = '';
		oppDescription = '';
		oppSkillsRequired = '';
		oppCommitment = '';
		oppContactMethod = '';
		learnInsight = '';
		learnApplication = '';
		learnSkills = '';
		buildTitle = '';
		buildDescription = '';
		buildProjectUrl = '';
		buildDecision = '';
		questionText = '';
		questionOptions = ['', ''];
		questionContext = '';
	}

	function addOption() {
		questionOptions = [...questionOptions, ''];
	}

	function removeOption(index: number) {
		if (questionOptions.length <= 2) return;
		questionOptions = questionOptions.filter((_, i) => i !== index);
	}

	function updateOption(index: number, value: string) {
		const next = [...questionOptions];
		next[index] = value;
		questionOptions = next;
	}

	function buildData(): Record<string, unknown> {
		switch (selectedType) {
			case 'ACHIEVEMENT':
				return {
					title: achTitle || undefined,
					organization: achOrganization || undefined,
					date: achDate || undefined,
					description: achDescription || undefined
				};
			case 'OPPORTUNITY':
				return {
					description: oppDescription || undefined,
					skills_required: oppSkillsRequired ? oppSkillsRequired.split(',').map(s => s.trim()).filter(Boolean) : undefined,
					commitment: oppCommitment || undefined,
					contact_method: oppContactMethod || undefined
				};
			case 'LEARNING':
				return {
					insight: learnInsight || undefined,
					application: learnApplication || undefined,
					skills: learnSkills ? learnSkills.split(',').map(s => s.trim()).filter(Boolean) : undefined
				};
			case 'BUILD':
				return {
					title: buildTitle || undefined,
					description: buildDescription || undefined,
					project_url: buildProjectUrl || undefined,
					decision_or_solution: buildDecision || undefined
				};
			case 'QUESTION':
				return {
					question: questionText || undefined,
					options: questionOptions.filter(o => o.trim()).map(o => ({ text: o.trim() })),
					context: questionContext || undefined
				};
		}
	}

	async function handleSubmit() {
		if (submitting) return;
		submitting = true;
		try {
			const hardSkills = hardSkillsInput ? hardSkillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
			const softSkills = softSkillsInput ? softSkillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
			const data = buildData();

			await postsCreate({
				body: JSON.stringify({
					type: selectedType,
					data,
					content: content || undefined,
					hardSkills: hardSkills.length > 0 ? hardSkills : undefined,
					softSkills: softSkills.length > 0 ? softSkills : undefined,
					imageUrl: imageUrl || undefined,
					linkUrl: linkUrl || undefined
				}),
				headers: { 'Content-Type': 'application/json' }
			});
			resetForm();
			oncreate();
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		resetForm();
		oncancel();
	}

	const typeLabels: Record<PostType, string> = {
		ACHIEVEMENT: 'Achievement',
		OPPORTUNITY: 'Opportunity',
		LEARNING: 'Learning',
		BUILD: 'Build',
		QUESTION: 'Question'
	};
</script>

<Modal {open} onClose={handleCancel}>
	{#snippet title()}
		{step === 1 ? 'Create Post' : `New ${typeLabels[selectedType]}`}
	{/snippet}

	<div class="max-h-[60vh] space-y-4 overflow-y-auto">
		{#if step === 1}
			<!-- Step 1: Select type -->
			<p class="text-xs text-gray-400 dark:text-neutral-500">What would you like to share?</p>
			<div class="grid grid-cols-1 gap-2">
				{#each postTypes as pType}
					<button
						class="rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors text-gray-800 dark:text-neutral-200 {selectedType === pType ? 'border-gray-800 bg-gray-100 dark:border-neutral-400 dark:bg-neutral-700' : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50'}"
						onclick={() => selectedType = pType}
					>
						{typeLabels[pType]}
					</button>
				{/each}
			</div>
			<Button variant="solid" size="md" onclick={() => step = 2}>
				Continue
			</Button>
		{:else}
			<!-- Step 2: Dynamic fields -->

			{#if selectedType === 'ACHIEVEMENT'}
				<Input placeholder="Title" bind:value={achTitle} />
				<Input placeholder="Organization" bind:value={achOrganization} />
				<Input placeholder="Date (e.g. 2026-01)" bind:value={achDate} />
				<textarea
					class="w-full rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
					placeholder="Description"
					rows="2"
					bind:value={achDescription}
				></textarea>
			{:else if selectedType === 'OPPORTUNITY'}
				<textarea
					class="w-full rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
					placeholder="Description"
					rows="2"
					bind:value={oppDescription}
				></textarea>
				<Input placeholder="Skills required (comma separated)" bind:value={oppSkillsRequired} />
				<Input placeholder="Commitment (e.g. Full-time, Part-time)" bind:value={oppCommitment} />
				<Input placeholder="Contact method" bind:value={oppContactMethod} />
			{:else if selectedType === 'LEARNING'}
				<Input placeholder="Key insight" bind:value={learnInsight} />
				<Input placeholder="How to apply" bind:value={learnApplication} />
				<Input placeholder="Related skills (comma separated)" bind:value={learnSkills} />
			{:else if selectedType === 'BUILD'}
				<Input placeholder="Project title" bind:value={buildTitle} />
				<textarea
					class="w-full rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
					placeholder="Description"
					rows="2"
					bind:value={buildDescription}
				></textarea>
				<Input placeholder="Project URL" bind:value={buildProjectUrl} />
				<Input placeholder="Key decision or solution" bind:value={buildDecision} />
			{:else if selectedType === 'QUESTION'}
				<Input placeholder="Your question" bind:value={questionText} />
				<div class="space-y-2">
					<p class="text-xs font-semibold text-gray-400 dark:text-neutral-500">Poll options</p>
					{#each questionOptions as option, i}
						<div class="flex items-center gap-2">
							<Input
								placeholder="Option {i + 1}"
								value={option}
								oninput={(e: Event) => updateOption(i, (e.target as HTMLInputElement).value)}
							/>
							{#if questionOptions.length > 2}
								<button class="text-red-400 hover:text-red-500" onclick={() => removeOption(i)}>
									<X size={14} />
								</button>
							{/if}
						</div>
					{/each}
					<Button variant="ghost" size="xs" onclick={addOption}>
						<Plus size={14} />
						Add option
					</Button>
				</div>
				<Input placeholder="Context (optional)" bind:value={questionContext} />
			{/if}

			<!-- Global fields -->
			<div class="border-t pt-4 border-gray-200 dark:border-neutral-700">
				<textarea
					class="w-full rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
					placeholder="What's on your mind? Use #hashtags..."
					rows="3"
					bind:value={content}
				></textarea>

				<div class="mt-3 space-y-2">
					<Input placeholder="Hard skills (comma separated)" bind:value={hardSkillsInput} />
					<Input placeholder="Soft skills (comma separated)" bind:value={softSkillsInput} />
				</div>

				<div class="mt-3 flex items-center gap-3">
					<div class="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
						<Image size={14} />
						<input
							type="text"
							placeholder="Image URL"
							class="bg-transparent text-xs outline-none placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-gray-800 dark:text-neutral-200"
							bind:value={imageUrl}
						/>
					</div>
					<div class="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
						<Link size={14} />
						<input
							type="text"
							placeholder="Link URL"
							class="bg-transparent text-xs outline-none placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-gray-800 dark:text-neutral-200"
							bind:value={linkUrl}
						/>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2 pt-2">
				<Button variant="ghost" size="sm" onclick={() => step = 1}>
					Back
				</Button>
				<div class="flex-1"></div>
				<Button variant="ghost" size="sm" onclick={handleCancel}>
					Cancel
				</Button>
				<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting}>
					{#if submitting}
						<Loader2 size={14} class="animate-spin" />
						Posting...
					{:else}
						Post
					{/if}
				</Button>
			</div>
		{/if}
	</div>
</Modal>
