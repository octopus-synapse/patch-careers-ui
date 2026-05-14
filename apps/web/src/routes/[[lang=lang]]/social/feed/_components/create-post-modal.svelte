<script lang="ts">
import { postV1Posts, postV1PostsUploadImage } from 'api-client';
import { Code, Image, ListChecks, X } from 'lucide-svelte';
import { Button, Loader, Modal, Textarea } from 'ui';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  open: boolean;
  oncreate: () => void;
  oncancel: () => void;
};

let { open, oncreate, oncancel }: Props = $props();

const t = $derived(locale.t);

let content = $state('');
let imageUrl = $state('');
let imageFile = $state<File | null>(null);
let uploadingImage = $state(false);

// Mutually-exclusive attachment: image XOR code. Poll can ride along.
let attachment = $state<'image' | 'poll' | 'code' | null>(null);
let codeSnippet = $state('');
let codeLanguage = $state('');
let pollOptions = $state<string[]>(['', '']);
let pollDeadline = $state('');

let submitting = $state(false);
let serverError = $state<string | null>(null);

function reset() {
  content = '';
  imageUrl = '';
  imageFile = null;
  attachment = null;
  codeSnippet = '';
  codeLanguage = '';
  pollOptions = ['', ''];
  pollDeadline = '';
  serverError = null;
}

function toggleAttachment(next: 'image' | 'poll' | 'code') {
  // image ⊕ code; poll can coexist.
  if (attachment === next) {
    attachment = null;
    return;
  }
  if (next === 'image' && attachment === 'code') return;
  if (next === 'code' && attachment === 'image') return;
  attachment = next;
}

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  uploadingImage = true;
  try {
    const form = new FormData();
    form.append('file', file);
    // The generated client passes the body through verbatim, so a
    // FormData payload travels as multipart/form-data automatically.
    const res = await postV1PostsUploadImage({ data: form } as unknown as Record<string, unknown>);
    imageUrl = res.url;
    imageFile = file;
  } catch (err) {
    imageFile = null;
    imageUrl = '';
    serverError = err instanceof Error ? err.message : t('errors.network');
  } finally {
    uploadingImage = false;
  }
}

async function handleSubmit() {
  if (submitting) return;
  if (!content.trim() && !imageUrl) return;

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
    reset();
    oncreate();
  } catch (err) {
    serverError = err instanceof Error ? err.message : t('errors.network');
  } finally {
    submitting = false;
  }
}

function handleCancel() {
  reset();
  oncancel();
}
</script>

<Modal {open} onClose={handleCancel}>
	<div class="w-full max-w-xl p-5 sm:p-6">
		<header class="mb-4 flex items-center justify-between">
			<h2 class="text-base font-bold text-gray-900 dark:text-zinc-100">
				{t('feed.composer.post')}
			</h2>
			<button
				type="button"
				class="rounded-lg p-1 text-gray-500 hover:bg-black/5 dark:hover:bg-white/5"
				aria-label={t('common.close') ?? 'Close'}
				onclick={handleCancel}
			>
				<X size={16} />
			</button>
		</header>

		<Textarea
			bind:value={content}
			rows={5}
			placeholder={t('feed.composer.placeholder')}
			maxlength={3000}
		/>

		{#if attachment === 'poll'}
			<div class="mt-3 space-y-2">
				{#each pollOptions as _, i}
					<input
						type="text"
						bind:value={pollOptions[i]}
						class="block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
						placeholder={`Opção ${i + 1}`}
						maxlength={80}
					/>
				{/each}
				{#if pollOptions.length < 4}
					<button
						type="button"
						class="text-xs font-semibold text-blue-600 hover:underline"
						onclick={() => (pollOptions = [...pollOptions, ''])}
					>
						+ adicionar opção
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
			<div class="mt-3 space-y-2">
				<input
					type="text"
					bind:value={codeLanguage}
					class="block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
					placeholder="Linguagem (ex.: ts, py)"
					maxlength={40}
				/>
				<Textarea bind:value={codeSnippet} rows={6} placeholder="// código..." maxlength={20000} />
			</div>
		{/if}

		{#if attachment === 'image' && imageUrl}
			<div class="mt-3 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/5">
				<img src={imageUrl} alt="" class="w-full" />
			</div>
		{/if}

		{#if serverError}
			<p class="mt-2 text-xs text-rose-600 dark:text-rose-400">{serverError}</p>
		{/if}

		<footer class="mt-4 flex items-center justify-between gap-3 border-t border-black/5 pt-3 dark:border-white/5">
			<div class="flex items-center gap-1">
				<label
					class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors {attachment ===
					'image'
						? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5'} {attachment ===
					'code'
						? 'opacity-40 pointer-events-none'
						: 'cursor-pointer'}"
				>
					<Image size={16} />
					<span class="hidden sm:inline">{t('feed.composer.addImage')}</span>
					<input
						type="file"
						accept="image/png,image/jpeg,image/webp"
						class="hidden"
						onchange={(e) => {
							if (attachment === 'code') return;
							attachment = 'image';
							handleImageUpload(e);
						}}
					/>
				</label>
				<button
					type="button"
					class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors {attachment ===
					'poll'
						? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5'}"
					onclick={() => toggleAttachment('poll')}
				>
					<ListChecks size={16} />
					<span class="hidden sm:inline">Poll</span>
				</button>
				<button
					type="button"
					disabled={attachment === 'image'}
					class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors {attachment ===
					'code'
						? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
						: 'text-gray-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5'} disabled:opacity-40"
					onclick={() => toggleAttachment('code')}
				>
					<Code size={16} />
					<span class="hidden sm:inline">Código</span>
				</button>
			</div>

			<Button
				variant="glossy"
				size="sm"
				onclick={handleSubmit}
				disabled={submitting || uploadingImage || (!content.trim() && !imageUrl)}
			>
				{#if submitting}
					<Loader size={14} />
				{:else}
					{t('feed.composer.post')}
				{/if}
			</Button>
		</footer>
	</div>
</Modal>
