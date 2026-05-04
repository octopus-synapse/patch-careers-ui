<script lang="ts">
import {
  type PostsCreateMutationRequest,
  type PostsCreateMutationRequestAnonymousCategoryEnumKey,
  type PostsCreateMutationRequestTypeEnumKey,
  postsCreate,
  postsUploadImage,
} from 'api-client';
import { AlertTriangle, Banknote, BookOpen, Briefcase, Calendar, ChevronRight, Code, Eye, EyeOff, Hammer, HelpCircle, Image, Link, LogOut, MessageSquare, Plus, ShieldAlert, Trophy, Upload, Users, X, Zap } from 'lucide-svelte';
import { Badge, Button, Input, Loader, Modal, Textarea } from 'ui';

type Props = {
  open: boolean;
  oncreate: () => void;
  oncancel: () => void;
};

let { open, oncreate, oncancel }: Props = $props();

// Subset of `PostsCreateMutationRequestTypeEnumKey` exposed in this composer — REPOST is
// surfaced through a separate "quote repost" flow.
type PostType = Exclude<PostsCreateMutationRequestTypeEnumKey, 'REPOST'>;
const postTypes: readonly PostType[] = [
  'ACHIEVEMENT',
  'OPPORTUNITY',
  'LEARNING',
  'BUILD',
  'QUESTION',
  'CHALLENGE',
] as const;

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
const codeLanguages = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C++',
  'HTML',
  'CSS',
  'SQL',
];

// Thread mode
let isThread = $state(false);
let threadPosts = $state<string[]>(['']);

// Blind Mode — only available in sensitive categories. Category must be
// selected when `isAnonymous=true` (backend enforces via Zod refinement).
let isAnonymous = $state(false);
let anonymousCategory = $state<PostsCreateMutationRequestAnonymousCategoryEnumKey | ''>('');
const anonymousCategoryOptions: Array<{
  value: PostsCreateMutationRequestAnonymousCategoryEnumKey;
  label: string;
  icon: typeof Trophy;
}> = [
  { value: 'SALARY', label: 'Salário', icon: Banknote },
  { value: 'INTERVIEW', label: 'Entrevista', icon: MessageSquare },
  { value: 'LAYOFF', label: 'Demissão', icon: LogOut },
  { value: 'TOXIC_CULTURE', label: 'Cultura tóxica', icon: AlertTriangle },
  { value: 'HARASSMENT', label: 'Assédio', icon: ShieldAlert },
];

const blindModeInvalid = $derived(isAnonymous && !anonymousCategory);

const typeConfig: Record<PostType, { icon: typeof Trophy; description: string }> = {
  ACHIEVEMENT: { icon: Trophy, description: 'Share a win or milestone' },
  OPPORTUNITY: { icon: Briefcase, description: 'Post a job or collab opportunity' },
  LEARNING: { icon: BookOpen, description: 'Share an insight or lesson' },
  BUILD: { icon: Hammer, description: 'Showcase a project' },
  QUESTION: { icon: HelpCircle, description: 'Ask the community' },
  CHALLENGE: { icon: Zap, description: 'Propose a technical challenge' },
};

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
  isAnonymous = false;
  anonymousCategory = '';
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
    const formData = new FormData();
    formData.append('file', file);
    const result = await postsUploadImage({ data: formData });
    imageUrl = result?.url ?? '';
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
        description: achDescription || undefined,
      };
    case 'OPPORTUNITY':
      return {
        description: oppDescription || undefined,
        skills_required: oppSkillsRequired
          ? oppSkillsRequired
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        commitment: oppCommitment || undefined,
        contact_method: oppContactMethod || undefined,
      };
    case 'LEARNING':
      return {
        insight: learnInsight || undefined,
        application: learnApplication || undefined,
        skills: learnSkills
          ? learnSkills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      };
    case 'BUILD':
      return {
        title: buildTitle || undefined,
        description: buildDescription || undefined,
        project_url: buildProjectUrl || undefined,
        decision_or_solution: buildDecision || undefined,
      };
    case 'QUESTION':
      return {
        question: questionText || undefined,
        options: questionOptions.filter((o) => o.trim()).map((o) => ({ text: o.trim() })),
        context: questionContext || undefined,
        pollDeadline: pollDeadline || undefined,
      };
    case 'CHALLENGE':
      return {
        title: challengeTitle || undefined,
        description: challengeDescription || undefined,
        difficulty: challengeDifficulty,
        deadline: challengeDeadline || undefined,
      };
  }
}

async function handleSubmit() {
  if (submitting) return;
  submitting = true;
  try {
    const hardSkills = hardSkillsInput
      ? hardSkillsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const softSkills = softSkillsInput
      ? softSkillsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const data = buildData();

    const payload: PostsCreateMutationRequest = {
      type: selectedType,
      // `data` is loosely typed as `PostsCreateBodyData` (Record<string,
      // unknown>) — backend validates per-type with Zod.
      data: data as unknown as PostsCreateMutationRequest['data'],
      content: content || undefined,
      hardSkills: hardSkills.length > 0 ? hardSkills : undefined,
      softSkills: softSkills.length > 0 ? softSkills : undefined,
      imageUrl: imageUrl || undefined,
      linkUrl: linkUrl || undefined,
      coAuthors: coAuthors.length > 0 ? coAuthors : undefined,
      scheduledAt: scheduledAt || undefined,
      codeSnippet: codeSnippet
        ? { language: codeLanguage || 'plaintext', code: codeSnippet }
        : undefined,
      isAnonymous: isAnonymous || undefined,
      anonymousCategory: isAnonymous && anonymousCategory ? anonymousCategory : undefined,
    };

    await postsCreate(payload);
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
  CHALLENGE: 'Challenge',
};
</script>

<Modal {open} onClose={handleCancel}>
	{#snippet title()}
		<div class="flex items-center gap-2">
			<span>{step === 1 ? 'Create Post' : `New ${typeLabels[selectedType]}`}</span>
			<span class="ml-auto text-xs font-normal text-gray-400 dark:text-neutral-500">Step {step} of 2</span>
		</div>
	{/snippet}

	<div class="max-h-[70vh] sm:max-h-[60vh] space-y-4 overflow-y-auto">
		{#if step === 1}
			<!-- Step 1: Select type — 2-column grid -->
			<p class="text-xs text-gray-400 dark:text-neutral-500">What would you like to share?</p>
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#each postTypes as pType}
					{@const config = typeConfig[pType]}
					<button
						class="flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors {selectedType === pType ? 'border-gray-800 bg-gray-50 dark:border-neutral-400 dark:bg-neutral-700/50' : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50'}"
						onclick={() => selectedType = pType}
					>
						<div class="flex items-center gap-2">
							<config.icon size={16} class="text-gray-600 dark:text-neutral-300" />
							<span class="text-sm font-medium text-gray-800 dark:text-neutral-200">{typeLabels[pType]}</span>
						</div>
						<span class="text-[11px] leading-tight text-gray-400 dark:text-neutral-500">{config.description}</span>
					</button>
				{/each}
			</div>
			<Button variant="solid" size="md" onclick={() => step = 2}>
				Continue
			</Button>
		{:else}
			<!-- Step 2: Dynamic fields -->

			<!-- Type-specific fields section -->
			<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500">{typeLabels[selectedType]} Details</p>

			{#if selectedType === 'ACHIEVEMENT'}
				<div class="space-y-3">
					<Input placeholder="Title" bind:value={achTitle} />
					<Input placeholder="Organization" bind:value={achOrganization} />
					<Input placeholder="Date (e.g. 2026-01)" bind:value={achDate} />
					<Textarea
						placeholder="Description"
						rows={2}
						bind:value={achDescription}
					/>
				</div>
			{:else if selectedType === 'OPPORTUNITY'}
				<div class="space-y-3">
					<Textarea
						placeholder="Description"
						rows={2}
						bind:value={oppDescription}
					/>
					<Input placeholder="Skills required (comma separated)" bind:value={oppSkillsRequired} />
					<Input placeholder="Commitment (e.g. Full-time, Part-time)" bind:value={oppCommitment} />
					<Input placeholder="Contact method" bind:value={oppContactMethod} />
				</div>
			{:else if selectedType === 'LEARNING'}
				<div class="space-y-3">
					<Input placeholder="Key insight" bind:value={learnInsight} />
					<Input placeholder="How to apply" bind:value={learnApplication} />
					<Input placeholder="Related skills (comma separated)" bind:value={learnSkills} />
				</div>
			{:else if selectedType === 'BUILD'}
				<div class="space-y-3">
					<Input placeholder="Project title" bind:value={buildTitle} />
					<Textarea
						placeholder="Description"
						rows={2}
						bind:value={buildDescription}
					/>
					<Input placeholder="Project URL" bind:value={buildProjectUrl} />
					<Input placeholder="Key decision or solution" bind:value={buildDecision} />
				</div>
			{:else if selectedType === 'QUESTION'}
				<div class="space-y-3">
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
									<Button variant="icon" onclick={() => removeOption(i)} class="text-red-400 hover:text-red-500">
										<X size={14} />
									</Button>
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
				</div>
			{:else if selectedType === 'CHALLENGE'}
				<div class="space-y-3">
					<Input placeholder="Challenge title" bind:value={challengeTitle} />
					<Textarea
						placeholder="Description"
						rows={3}
						bind:value={challengeDescription}
					/>
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
				</div>
			{/if}

			<!-- Content section -->
			<div class="border-t pt-4 border-gray-200 dark:border-neutral-700">
				<p class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500">Content</p>
				<Textarea
					placeholder="What's on your mind? Use #hashtags..."
					rows={3}
					bind:value={content}
				/>

				<div class="mt-3 space-y-2">
					<Input placeholder="Hard skills (comma separated)" bind:value={hardSkillsInput} />
					<Input placeholder="Soft skills (comma separated)" bind:value={softSkillsInput} />
				</div>
			</div>

			<!-- Media & Links collapsible -->
			<details class="border-t pt-3 border-gray-200 dark:border-neutral-700">
				<summary class="cursor-pointer text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500 select-none">Media & Links</summary>
				<div class="mt-3 space-y-3">
					<!-- Image upload — dashed drop zone -->
					{#if imageUrl}
						<div class="flex items-center gap-2 rounded-lg border p-2 border-gray-200 dark:border-neutral-700/50">
							<img src={imageUrl} alt="Upload preview" class="h-12 w-12 rounded object-cover" />
							<span class="flex-1 truncate text-xs text-gray-600 dark:text-neutral-400">{imageFile?.name ?? 'Uploaded'}</span>
							<Button variant="icon" onclick={clearImage} class="text-red-400 hover:text-red-500">
								<X size={14} />
							</Button>
						</div>
					{:else}
						<label class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-600 p-6 text-center transition-colors hover:border-gray-400 dark:hover:border-neutral-500">
							{#if uploadingImage}
								<Loader size={20} />
								<span class="text-xs text-gray-400 dark:text-neutral-500">Uploading...</span>
							{:else}
								<Upload size={20} class="text-gray-400 dark:text-neutral-500" />
								<span class="text-xs text-gray-400 dark:text-neutral-500">Click to upload an image</span>
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

					<!-- Link URL -->
					<div class="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
						<Link size={14} />
						<Input
							type="text"
							placeholder="Link URL"
							bind:value={linkUrl}
						/>
					</div>
				</div>
			</details>

			<!-- Advanced collapsible -->
			<details class="border-t pt-3 border-gray-200 dark:border-neutral-700">
				<summary class="cursor-pointer text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500 select-none">Advanced</summary>
				<div class="mt-3 space-y-3">
					<!-- Code snippet -->
					<div class="space-y-2">
						<Button
							variant="ghost"
							size="xs"
							onclick={() => { if (codeSnippet) { codeSnippet = ''; codeLanguage = ''; } else { codeLanguage = 'JavaScript'; } }}
						>
							<Code size={14} />
							{codeSnippet || codeLanguage ? 'Remove code snippet' : 'Add code snippet'}
						</Button>
						{#if codeLanguage || codeSnippet}
							<select
								class="w-full rounded-lg border bg-transparent px-3 py-2 text-xs outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
								bind:value={codeLanguage}
							>
								{#each codeLanguages as lang}
									<option value={lang}>{lang}</option>
								{/each}
							</select>
							<Textarea
								class="font-mono text-xs"
								placeholder="Paste your code here..."
								rows={5}
								bind:value={codeSnippet}
							/>
						{/if}
					</div>

					<!-- Co-authors -->
					<div class="space-y-2">
						<div class="flex items-center gap-1.5 text-gray-400 dark:text-neutral-500">
							<Users size={14} />
							<Input
								type="text"
								placeholder="Add co-author (username)"
								bind:value={coAuthorSearch}
								onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addCoAuthor(); } }}
							/>
							{#if coAuthorSearch.trim()}
								<Button variant="ghost" size="xs" onclick={addCoAuthor}>Add</Button>
							{/if}
						</div>
						{#if coAuthors.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each coAuthors as coAuthor, i}
									<Badge intent="neutral" size="md">
										<span class="inline-flex items-center gap-1">
											@{coAuthor}
											<Button variant="icon" onclick={() => removeCoAuthor(i)} class="text-red-400 hover:text-red-500">
												<X size={10} />
											</Button>
										</span>
									</Badge>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Schedule post -->
					<div class="flex items-center gap-2">
						<Calendar size={14} class="text-gray-400 dark:text-neutral-500" />
						<input
							type="datetime-local"
							class="flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs outline-none text-gray-800 dark:text-neutral-200 border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
							bind:value={scheduledAt}
						/>
						<span class="text-[10px] text-gray-400 dark:text-neutral-500">Schedule</span>
						{#if scheduledAt}
							<Button variant="icon" onclick={() => scheduledAt = ''} class="text-red-400 hover:text-red-500">
								<X size={12} />
							</Button>
						{/if}
					</div>

					<!-- Thread mode -->
					<div>
						<Button
							variant="ghost"
							size="xs"
							onclick={() => { isThread = !isThread; if (!isThread) { threadPosts = ['']; } }}
						>
							<MessageSquare size={14} />
							{isThread ? 'Cancel thread' : 'Continue as thread'}
						</Button>
						{#if isThread}
							<div class="mt-2 space-y-2 border-l-2 border-gray-200 dark:border-neutral-700 pl-4 ml-2">
								{#each threadPosts as threadPost, i}
									<div class="flex items-start gap-2">
										<Textarea
											class="flex-1"
											placeholder="Thread post {i + 2}..."
											rows={2}
											value={threadPost}
											oninput={(e: Event) => updateThreadPost(i, (e.target as HTMLTextAreaElement).value)}
										/>
										{#if threadPosts.length > 1}
											<Button variant="icon" onclick={() => removeThreadPost(i)} class="mt-2 text-red-400 hover:text-red-500">
												<X size={14} />
											</Button>
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
			</details>

			<!-- Blind Mode — first-class section, not hidden under "Advanced".
				Identity-hiding is a flagship feature for sensitive conversations
				(salary, layoff, toxic culture, harassment, interview experiences)
				so it deserves top-level real estate, not a collapsed toggle. -->
			<div class="rounded-xl border-2 {isAnonymous ? 'border-violet-300 bg-violet-50 dark:border-violet-700/60 dark:bg-violet-950/20' : 'border-gray-200 dark:border-neutral-700/60'} p-3">
				<label class="flex cursor-pointer items-start gap-3">
					<input
						type="checkbox"
						bind:checked={isAnonymous}
						class="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 dark:border-neutral-600"
					/>
					<div class="flex-1">
						<div class="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-neutral-200">
							{#if isAnonymous}
								<EyeOff size={14} class="text-violet-600 dark:text-violet-400" />
							{:else}
								<Eye size={14} class="text-gray-400 dark:text-neutral-500" />
							{/if}
							Postar anonimamente
						</div>
						<p class="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-neutral-500">
							Seu nome e avatar ficam ocultos. Use pra conversas honestas sobre tópicos sensíveis — salário, cultura tóxica, layoff. A plataforma ainda rastreia autoria para moderação.
						</p>
					</div>
				</label>

				{#if isAnonymous}
					<div class="mt-3 space-y-2">
						<p class="text-[10px] uppercase tracking-widest text-gray-500 dark:text-neutral-400">
							Escolha a categoria <span class="text-red-500">*</span>
						</p>
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{#each anonymousCategoryOptions as opt}
								{@const selected = anonymousCategory === opt.value}
								<button
									type="button"
									class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors {selected ? 'border-violet-500 bg-violet-100 text-violet-800 dark:border-violet-400 dark:bg-violet-900/40 dark:text-violet-200' : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50'}"
									onclick={() => { anonymousCategory = opt.value; }}
								>
									<opt.icon size={12} class={selected ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-neutral-500'} />
									<span class={selected ? 'font-medium' : ''}>{opt.label}</span>
								</button>
							{/each}
						</div>
						{#if blindModeInvalid}
							<p class="text-[11px] text-red-600 dark:text-red-400">
								Escolha uma categoria para postar anonimamente.
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap items-center gap-2 border-t pt-3 border-gray-200 dark:border-neutral-700">
				<Button variant="ghost" size="sm" onclick={() => step = 1}>
					Back
				</Button>
				<div class="flex-1"></div>
				<Button variant="ghost" size="sm" onclick={handleCancel}>
					Cancel
				</Button>
				<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting || uploadingImage || blindModeInvalid}>
					{#if submitting}
						<Loader size={14} />
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
