<script lang="ts">
	import { Modal, Button, Input } from 'ui';
	import { Loader2, Plus, X, Image, Link, Upload, Code, Calendar, Users, MessageSquare } from 'lucide-svelte';
	import { postsCreate, postsUploadImage } from 'api-client';

	type Props = {
		open: boolean;
		oncreate: () => void;
		oncancel: () => void;
	};

	let { open, oncreate, oncancel }: Props = $props();

	const postTypes = ['ACHIEVEMENT', 'OPPORTUNITY', 'LEARNING', 'BUILD', 'QUESTION', 'CHALLENGE'] as const;
	type PostType = typeof postTypes[number];

	let step = $state<1 | 2>(1);
	let selectedType = $state<PostType>('ACHIEVEMENT');
	let content = $state('');
	let hardSkillsInput = $state('');
	let softSkillsInput = $state('');
	let linkUrl = $state('');
	let imageUrl = $state('');
	let imageFile = $state<File | null>(null);
	let uploadingImage = $state(false);
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
	let pollDeadline = $state('');

	// CHALLENGE fields
	let challengeTitle = $state('');
	let challengeDescription = $state('');
	let challengeDifficulty = $state<'Easy' | 'Medium' | 'Hard'>('Medium');
	let challengeDeadline = $state('');

	// Co-authors
	let coAuthorSearch = $state('');
	let coAuthors = $state<string[]>([]);

	// Scheduled post
	let scheduledAt = $state('');

	// Code snippet
	let codeSnippet = $state('');
	let codeLanguage = $state('');
	const codeLanguages = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'HTML', 'CSS', 'SQL'];

	// Thread mode
	let isThread = $state(false);
	let threadPosts = $state<string[]>(['']);

	function resetForm() {
		step = 1;
		selectedType = 'ACHIEVEMENT';
		content = '';
		hardSkillsInput = '';
		softSkillsInput = '';
		linkUrl = '';
		imageUrl = '';
		imageFile = null;
		uploadingImage = false;
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
		pollDeadline = '';
		challengeTitle = '';
		challengeDescription = '';
		challengeDifficulty = 'Medium';
		challengeDeadline = '';
		coAuthorSearch = '';
		coAuthors = [];
		scheduledAt = '';
		codeSnippet = '';
		codeLanguage = '';
		isThread = false;
		threadPosts = [''];
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

	function addCoAuthor() {
		if (!coAuthorSearch.trim()) return;
		if (!coAuthors.includes(coAuthorSearch.trim())) {
			coAuthors = [...coAuthors, coAuthorSearch.trim()];
		}
		coAuthorSearch = '';
	}

	function removeCoAuthor(index: number) {
		coAuthors = coAuthors.filter((_, i) => i !== index);
	}

	function addThreadPost() {
		threadPosts = [...threadPosts, ''];
	}

	function updateThreadPost(index: number, value: string) {
		const next = [...threadPosts];
		next[index] = value;
		threadPosts = next;
	}

	function removeThreadPost(index: number) {
		if (threadPosts.length <= 1) return;
		threadPosts = threadPosts.filter((_, i) => i !== index);
	}

	async function handleImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];
		imageFile = file;
		uploadingImage = true;
		try {
			const result = await postsUploadImage({ file });
			imageUrl = result.url;
		} catch {
			imageFile = null;
			imageUrl = '';
		} finally {
			uploadingImage = false;
		}
	}

	function clearImage() {
		imageFile = null;
		imageUrl = '';
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
					context: questionContext || undefined,
					pollDeadline: pollDeadline || undefined
				};
			case 'CHALLENGE':
				return {
					title: challengeTitle || undefined,
					description: challengeDescription || undefined,
					difficulty: challengeDifficulty,
					deadline: challengeDeadline || undefined
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

			const payload: Record<string, unknown> = {
				type: selectedType,
				data,
				content: content || undefined,
				hardSkills: hardSkills.length > 0 ? hardSkills : undefined,
				softSkills: softSkills.length > 0 ? softSkills : undefined,
				imageUrl: imageUrl || undefined,
				linkUrl: linkUrl || undefined
			};

			if (coAuthors.length > 0) {
				payload.coAuthors = coAuthors;
			}
			if (scheduledAt) {
				payload.scheduledAt = scheduledAt;
			}
			if (codeSnippet) {
				payload.codeSnippet = codeSnippet;
				if (codeLanguage) {
					payload.codeLanguage = codeLanguage;
				}
			}
			if (isThread && threadPosts.length > 0) {
				payload.isThread = true;
				payload.threadPosts = threadPosts.filter(t => t.trim());
			}

			await postsCreate({
				body: JSON.stringify(payload),
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
		QUESTION: 'Question',
		CHALLENGE: 'Challenge'
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
				<div class="flex items-center gap-2">
					<Calendar size={14} class="text-gray-400 dark:text-neutral-500" />
					<input
						type="datetime-local"
						class="flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
						bind:value={pollDeadline}
					/>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">Poll deadline</span>
				</div>
			{:else if selectedType === 'CHALLENGE'}
				<Input placeholder="Challenge title" bind:value={challengeTitle} />
				<textarea
					class="w-full rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
					placeholder="Description"
					rows="3"
					bind:value={challengeDescription}
				></textarea>
				<div class="space-y-2">
					<p class="text-xs font-semibold text-gray-400 dark:text-neutral-500">Difficulty</p>
					<div class="flex gap-2">
						{#each ['Easy', 'Medium', 'Hard'] as diff}
							<button
								class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {challengeDifficulty === diff ? 'border-gray-800 bg-gray-100 dark:border-neutral-400 dark:bg-neutral-700' : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50'} text-gray-800 dark:text-neutral-200"
								onclick={() => challengeDifficulty = diff as 'Easy' | 'Medium' | 'Hard'}
							>
								{diff}
							</button>
						{/each}
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Calendar size={14} class="text-gray-400 dark:text-neutral-500" />
					<input
						type="datetime-local"
						class="flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
						bind:value={challengeDeadline}
					/>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">Deadline</span>
				</div>
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

				<!-- Image upload -->
				<div class="mt-3">
					{#if imageUrl}
						<div class="flex items-center gap-2 rounded-lg border p-2 border-gray-200 dark:border-neutral-700/50">
							<img src={imageUrl} alt="Upload preview" class="h-12 w-12 rounded object-cover" />
							<span class="flex-1 truncate text-xs text-gray-600 dark:text-neutral-400">{imageFile?.name ?? 'Uploaded'}</span>
							<button class="text-red-400 hover:text-red-500" onclick={clearImage}>
								<X size={14} />
							</button>
						</div>
					{:else}
						<label class="flex cursor-pointer items-center gap-1.5 text-gray-400 dark:text-neutral-500 hover:opacity-70">
							{#if uploadingImage}
								<Loader2 size={14} class="animate-spin" />
								<span class="text-xs">Uploading...</span>
							{:else}
								<Upload size={14} />
								<span class="text-xs">Upload image</span>
							{/if}
							<input
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handleImageSelect}
								disabled={uploadingImage}
							/>
						</label>
					{/if}
				</div>

				<!-- Link URL -->
				<div class="mt-3 flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
					<Link size={14} />
					<input
						type="text"
						placeholder="Link URL"
						class="bg-transparent text-xs outline-none placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-gray-800 dark:text-neutral-200"
						bind:value={linkUrl}
					/>
				</div>

				<!-- Code snippet -->
				<div class="mt-3 space-y-2">
					<button
						class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500 hover:opacity-70"
						onclick={() => { if (codeSnippet) { codeSnippet = ''; codeLanguage = ''; } else { codeLanguage = 'JavaScript'; } }}
					>
						<Code size={14} />
						{codeSnippet || codeLanguage ? 'Remove code snippet' : 'Add code snippet'}
					</button>
					{#if codeLanguage || codeSnippet}
						<select
							class="w-full rounded-lg border bg-transparent px-3 py-2 text-xs outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
							bind:value={codeLanguage}
						>
							{#each codeLanguages as lang}
								<option value={lang}>{lang}</option>
							{/each}
						</select>
						<textarea
							class="w-full rounded-lg border bg-transparent p-3 font-mono text-xs outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
							placeholder="Paste your code here..."
							rows="5"
							bind:value={codeSnippet}
						></textarea>
					{/if}
				</div>

				<!-- Co-authors -->
				<div class="mt-3 space-y-2">
					<div class="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
						<Users size={14} />
						<input
							type="text"
							placeholder="Add co-author (username)"
							class="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400 dark:placeholder:text-neutral-500 text-gray-800 dark:text-neutral-200"
							bind:value={coAuthorSearch}
							onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addCoAuthor(); } }}
						/>
						{#if coAuthorSearch.trim()}
							<button class="text-xs text-blue-500 hover:underline" onclick={addCoAuthor}>Add</button>
						{/if}
					</div>
					{#if coAuthors.length > 0}
						<div class="flex flex-wrap gap-1.5">
							{#each coAuthors as coAuthor, i}
								<span class="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-neutral-700/50 dark:text-neutral-300">
									@{coAuthor}
									<button class="text-red-400 hover:text-red-500" onclick={() => removeCoAuthor(i)}>
										<X size={10} />
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Schedule post -->
				<div class="mt-3 flex items-center gap-2">
					<Calendar size={14} class="text-gray-400 dark:text-neutral-500" />
					<input
						type="datetime-local"
						class="flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
						bind:value={scheduledAt}
					/>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">Schedule</span>
					{#if scheduledAt}
						<button class="text-red-400 hover:text-red-500" onclick={() => scheduledAt = ''}>
							<X size={12} />
						</button>
					{/if}
				</div>

				<!-- Thread mode -->
				<div class="mt-3">
					<button
						class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500 hover:opacity-70"
						onclick={() => { isThread = !isThread; if (!isThread) { threadPosts = ['']; } }}
					>
						<MessageSquare size={14} />
						{isThread ? 'Cancel thread' : 'Continue as thread'}
					</button>
					{#if isThread}
						<div class="mt-2 space-y-2">
							{#each threadPosts as threadPost, i}
								<div class="flex items-start gap-2">
									<div class="mt-2 h-0.5 w-4 bg-gray-200 dark:bg-neutral-700"></div>
									<textarea
										class="flex-1 rounded-lg border bg-transparent p-3 text-sm outline-none transition-colors resize-none bg-white text-gray-800 border-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600"
										placeholder="Thread post {i + 2}..."
										rows="2"
										value={threadPost}
										oninput={(e: Event) => updateThreadPost(i, (e.target as HTMLTextAreaElement).value)}
									></textarea>
									{#if threadPosts.length > 1}
										<button class="mt-2 text-red-400 hover:text-red-500" onclick={() => removeThreadPost(i)}>
											<X size={14} />
										</button>
									{/if}
								</div>
							{/each}
							<Button variant="ghost" size="xs" onclick={addThreadPost}>
								<Plus size={14} />
								Add to thread
							</Button>
						</div>
					{/if}
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
				<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting || uploadingImage}>
					{#if submitting}
						<Loader2 size={14} class="animate-spin" />
						Posting...
					{:else if scheduledAt}
						Schedule
					{:else}
						Post
					{/if}
				</Button>
			</div>
		{/if}
	</div>
</Modal>
