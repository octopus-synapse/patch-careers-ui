<script lang="ts">
import { postV1Posts, postV1PostsUploadImage } from 'api-client';
import { ChevronDown, Code, Globe, Image, ListChecks, Smile, Users, X } from 'lucide-svelte';
import { Avatar, Loader, Modal, Tooltip } from 'ui';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

type Visibility = 'anyone' | 'connections';
type DraftPayload = {
  content: string;
  imageUrl: string;
  attachment: 'image' | 'poll' | 'code' | null;
  codeSnippet: string;
  codeLanguage: string;
  pollOptions: string[];
  pollDeadline: string;
  visibility: Visibility;
};

const DRAFT_KEY = 'feed-composer:draft:v1';
const MAX_CHARS = 3000;

type Props = {
  open: boolean;
  oncreate: () => void;
  oncancel: () => void;
};

let { open, oncreate, oncancel }: Props = $props();

const t = $derived(locale.t);
const session = useAuth();
const userName = $derived(String(session.user?.name ?? ''));
const userPhoto = $derived(
  (session.user as unknown as { photoURL?: string | null } | null)?.photoURL ?? null,
);
const firstName = $derived((userName ?? '').split(' ')[0] ?? '');
const placeholder = $derived(
  firstName
    ? t('feed.composer.placeholderQuestion', { name: firstName })
    : t('feed.composer.placeholderGeneric'),
);

let content = $state('');
let imageUrl = $state('');
let imageFile = $state<File | null>(null);
let uploadingImage = $state(false);

let attachment = $state<'image' | 'poll' | 'code' | null>(null);
let codeSnippet = $state('');
let codeLanguage = $state('');
let pollOptions = $state<string[]>(['', '']);
let pollDeadline = $state('');

let visibility = $state<Visibility>('anyone');
let visibilityOpen = $state(false);

let submitting = $state(false);
let serverError = $state<string | null>(null);
let dragging = $state(false);

let textareaEl: HTMLTextAreaElement | null = $state(null);
let fileInputEl: HTMLInputElement | null = $state(null);

const charCount = $derived(content.length);
const overLimit = $derived(charCount > MAX_CHARS);
const canSubmit = $derived(!submitting && !overLimit && (content.trim().length > 0 || Boolean(imageUrl)));

function reset() {
  content = '';
  imageUrl = '';
  imageFile = null;
  attachment = null;
  codeSnippet = '';
  codeLanguage = '';
  pollOptions = ['', ''];
  pollDeadline = '';
  visibility = 'anyone';
  serverError = null;
}

// ---- Draft persistence ----
// Click-outside / Esc / explicit Draft button all save to localStorage.
// Posting clears the draft. Opening the modal restores it.
function loadDraft(): DraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    return parsed;
  } catch {
    return null;
  }
}

function persistDraft(): void {
  if (typeof window === 'undefined') return;
  const empty =
    !content.trim() &&
    !imageUrl &&
    !codeSnippet.trim() &&
    pollOptions.every((o) => !o.trim());
  if (empty) {
    window.localStorage.removeItem(DRAFT_KEY);
    return;
  }
  const payload: DraftPayload = {
    content,
    imageUrl,
    attachment,
    codeSnippet,
    codeLanguage,
    pollOptions,
    pollDeadline,
    visibility,
  };
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

function clearDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_KEY);
}

function restoreDraft(): void {
  const draft = loadDraft();
  if (!draft) return;
  content = draft.content ?? '';
  imageUrl = draft.imageUrl ?? '';
  attachment = draft.attachment ?? null;
  codeSnippet = draft.codeSnippet ?? '';
  codeLanguage = draft.codeLanguage ?? '';
  pollOptions = draft.pollOptions ?? ['', ''];
  pollDeadline = draft.pollDeadline ?? '';
  visibility = draft.visibility ?? 'anyone';
}

$effect(() => {
  if (open) {
    restoreDraft();
    queueMicrotask(() => textareaEl?.focus());
  }
});

function handleDraft(): void {
  persistDraft();
  oncancel();
}

function handleCancel(): void {
  // Click-outside / X / Esc — behave like Draft. The modal closes
  // but the user's typing survives in localStorage and re-opens on
  // next composer launch.
  persistDraft();
  oncancel();
}

// ---- Attachments ----
function toggleAttachment(next: 'image' | 'poll' | 'code'): void {
  if (attachment === next) {
    attachment = null;
    return;
  }
  if (next === 'image' && attachment === 'code') return;
  if (next === 'code' && attachment === 'image') return;
  attachment = next;
  if (next === 'image' && !imageUrl) {
    queueMicrotask(() => fileInputEl?.click());
  }
}

async function uploadFile(file: File): Promise<void> {
  uploadingImage = true;
  serverError = null;
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await postV1PostsUploadImage({ data: form } as unknown as Record<string, unknown>);
    imageUrl = res.url;
    imageFile = file;
    attachment = 'image';
  } catch (err) {
    imageFile = null;
    imageUrl = '';
    serverError = err instanceof Error ? err.message : t('errors.network');
  } finally {
    uploadingImage = false;
  }
}

async function handleImageUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) await uploadFile(file);
}

function clearImage(): void {
  imageUrl = '';
  imageFile = null;
  if (attachment === 'image') attachment = null;
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  dragging = false;
  const file = event.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    await uploadFile(file);
  }
}

function handleDragOver(event: DragEvent): void {
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault();
    dragging = true;
  }
}

function handleDragLeave(event: DragEvent): void {
  if ((event.target as HTMLElement).id === 'composer-drop-zone') dragging = false;
}

// ---- Submit ----
async function handleSubmit(): Promise<void> {
  if (!canSubmit) return;
  submitting = true;
  serverError = null;
  try {
    const cleanedPoll =
      attachment === 'poll'
        ? pollOptions
            .map((s) => s.trim())
            .filter(Boolean)
            .map((label) => ({ label }))
        : undefined;
    await postV1Posts({
      content: content.trim() || undefined,
      imageUrl: imageUrl || undefined,
      pollOptions: cleanedPoll && cleanedPoll.length >= 2 ? cleanedPoll : undefined,
      pollDeadline: attachment === 'poll' && pollDeadline ? pollDeadline : undefined,
      codeSnippet: attachment === 'code' ? codeSnippet.trim() || undefined : undefined,
      codeLanguage:
        attachment === 'code' && codeLanguage.trim() ? codeLanguage.trim() : undefined,
    });
    clearDraft();
    reset();
    oncreate();
  } catch (err) {
    serverError = err instanceof Error ? err.message : t('errors.network');
  } finally {
    submitting = false;
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    void handleSubmit();
  }
}

const visibilityLabel = $derived(
  visibility === 'anyone'
    ? t('feed.composer.visibility.anyone')
    : t('feed.composer.visibility.connections'),
);
</script>

<Modal {open} onClose={handleCancel} size="2xl" padded={false}>
	<div
		id="composer-drop-zone"
		class="relative flex flex-col"
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onkeydown={handleKeydown}
		role="dialog"
	>
		<!-- Header: avatar + name + visibility dropdown + close -->
		<header class="flex items-center justify-between gap-3 border-b border-black/5 px-6 py-4 dark:border-white/5">
			<div class="flex min-w-0 items-center gap-3">
				<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" shape="circle" />
				<div class="relative min-w-0">
					<p class="truncate text-base font-bold text-gray-900 dark:text-zinc-100">{userName || 'U'}</p>
					<button
						type="button"
						class="mt-0.5 flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]"
						aria-label={t('feed.composer.visibilityAriaLabel')}
						aria-haspopup="menu"
						aria-expanded={visibilityOpen}
						onclick={() => (visibilityOpen = !visibilityOpen)}
					>
						{#if visibility === 'anyone'}
							<Globe size={13} />
						{:else}
							<Users size={13} />
						{/if}
						<span>{visibilityLabel}</span>
						<ChevronDown size={13} class={visibilityOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
					</button>
					{#if visibilityOpen}
						<div
							class="absolute left-0 top-full z-10 mt-1.5 w-60 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-900 dark:ring-white/5"
							role="menu"
						>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
								onclick={() => {
									visibility = 'anyone';
									visibilityOpen = false;
								}}
							>
								<Globe size={18} class={visibility === 'anyone' ? 'mt-0.5 text-blue-600 dark:text-blue-400' : 'mt-0.5 text-gray-500 dark:text-zinc-400'} />
								<span class="text-sm font-medium {visibility === 'anyone' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-zinc-200'}">
									{t('feed.composer.visibility.anyone')}
								</span>
							</button>
							<button
								type="button"
								role="menuitem"
								class="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
								onclick={() => {
									visibility = 'connections';
									visibilityOpen = false;
								}}
							>
								<Users size={18} class={visibility === 'connections' ? 'mt-0.5 text-blue-600 dark:text-blue-400' : 'mt-0.5 text-gray-500 dark:text-zinc-400'} />
								<span class="text-sm font-medium {visibility === 'connections' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-zinc-200'}">
									{t('feed.composer.visibility.connections')}
								</span>
							</button>
						</div>
					{/if}
				</div>
			</div>
			<button
				type="button"
				class="rounded-full p-2 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
				aria-label={t('common.close')}
				onclick={handleCancel}
			>
				<X size={20} strokeWidth={1.75} />
			</button>
		</header>

		<!-- Body: fixed-height scroll area with textarea + optional attachments -->
		<div class="relative h-[380px] overflow-y-auto px-6 pt-4 pb-6">
			<textarea
				bind:this={textareaEl}
				bind:value={content}
				rows={3}
				placeholder={placeholder}
				maxlength={MAX_CHARS + 200}
				class="w-full resize-none border-none bg-transparent text-[18px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
			></textarea>


			{#if attachment === 'poll'}
				<div class="mt-4 space-y-2 rounded-2xl border border-black/10 p-3 dark:border-white/10">
					{#each pollOptions as _, i (i)}
						<input
							type="text"
							bind:value={pollOptions[i]}
							class="block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
							placeholder={t('feed.composer.pollOptionPlaceholder', { index: i + 1 })}
							maxlength={80}
						/>
					{/each}
					{#if pollOptions.length < 4}
						<button
							type="button"
							class="text-xs font-semibold text-blue-600 hover:underline"
							onclick={() => (pollOptions = [...pollOptions, ''])}
						>
							{t('feed.composer.addOption')}
						</button>
					{/if}
					<input
						type="datetime-local"
						bind:value={pollDeadline}
						class="mt-1 block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
					/>
				</div>
			{/if}

			{#if attachment === 'code'}
				<div class="mt-4 space-y-2 rounded-2xl border border-black/10 p-3 dark:border-white/10">
					<input
						type="text"
						bind:value={codeLanguage}
						class="block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
						placeholder={t('feed.composer.codeLanguagePlaceholder')}
						maxlength={40}
					/>
					<textarea
						bind:value={codeSnippet}
						rows={6}
						placeholder={'// ...'}
						maxlength={20000}
						class="block w-full rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 font-mono text-xs text-gray-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
					></textarea>
				</div>
			{/if}

			{#if imageUrl}
				<div class="mt-4 relative overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/5">
					<img src={imageUrl} alt="" class="w-full" />
					<button
						type="button"
						aria-label={t('feed.composer.removeImage')}
						onclick={clearImage}
						class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
					>
						<X size={16} />
					</button>
				</div>
			{/if}

			{#if dragging}
				<div class="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10 text-sm font-semibold text-blue-600">
					{t('feed.composer.dropImageHint')}
				</div>
			{/if}

			{#if serverError}
				<p class="mt-3 text-xs text-rose-600 dark:text-rose-400">{serverError}</p>
			{/if}
		</div>

		<!-- Char counter — pinned at the bottom-right of the body's writing
		     surface, just above the action footer. Lives outside the
		     scrolling content so it doesn't drift with the user's scroll. -->
		<div
			class="pointer-events-none absolute right-7 bottom-[60px] z-10"
			aria-hidden="true"
		>
			<span
				class="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium tabular-nums backdrop-blur-sm dark:bg-zinc-900/80 {overLimit
					? 'text-rose-500'
					: 'text-gray-400 dark:text-zinc-500'}"
			>
				{t('feed.composer.charCount', { used: charCount, max: MAX_CHARS })}
			</span>
		</div>

		<!-- Footer: single row — actions left, counter+buttons right -->
		<footer class="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 bg-gray-50/50 px-6 py-3 dark:border-white/5 dark:bg-white/[0.02]">
			<div class="flex items-center gap-0.5">
				<Tooltip text={t('feed.composer.emojiTooltip')} position="bottom">
					<button
						type="button"
						aria-label={t('feed.composer.emojiTooltip')}
						class="rounded-full p-2.5 text-gray-500 transition-colors hover:bg-black/[0.05] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
						onclick={() => textareaEl?.focus()}
					>
						<Smile size={20} strokeWidth={1.75} />
					</button>
				</Tooltip>
				<Tooltip text={t('feed.composer.imageTooltip')} position="bottom">
					<label
						class="cursor-pointer rounded-full p-2.5 text-gray-500 transition-colors hover:bg-black/[0.05] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100 {attachment ===
						'code'
							? 'pointer-events-none opacity-40'
							: ''}"
						aria-label={t('feed.composer.imageTooltip')}
					>
						<Image size={20} strokeWidth={1.75} />
						<input
							bind:this={fileInputEl}
							type="file"
							accept="image/png,image/jpeg,image/webp"
							class="hidden"
							onchange={handleImageUpload}
						/>
					</label>
				</Tooltip>
				<Tooltip text={t('feed.composer.pollTooltip')} position="bottom">
					<button
						type="button"
						aria-label={t('feed.composer.pollTooltip')}
						class="rounded-full p-2.5 transition-colors {attachment === 'poll'
							? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
							: 'text-gray-500 hover:bg-black/[0.05] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100'}"
						onclick={() => toggleAttachment('poll')}
					>
						<ListChecks size={20} strokeWidth={1.75} />
					</button>
				</Tooltip>
				<Tooltip text={t('feed.composer.codeTooltip')} position="bottom">
					<button
						type="button"
						aria-label={t('feed.composer.codeTooltip')}
						disabled={attachment === 'image'}
						class="rounded-full p-2.5 transition-colors disabled:opacity-40 {attachment === 'code'
							? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
							: 'text-gray-500 hover:bg-black/[0.05] hover:text-gray-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100'}"
						onclick={() => toggleAttachment('code')}
					>
						<Code size={20} strokeWidth={1.75} />
					</button>
				</Tooltip>
				{#if uploadingImage}
					<span class="ml-1"><Loader size={14} /></span>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<span class="hidden text-[10px] text-gray-500 opacity-70 sm:inline dark:text-zinc-500">
					{t('feed.composer.shortcutHint')}
				</span>
				<button
					type="button"
					onclick={handleDraft}
					class="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
				>
					{t('feed.composer.draft')}
				</button>
				<button
					type="button"
					disabled={!canSubmit}
					onclick={handleSubmit}
					class="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
				>
					{#if submitting}
						<Loader size={14} />
					{:else}
						{t('feed.composer.post')}
					{/if}
				</button>
			</div>
		</footer>
	</div>
</Modal>
