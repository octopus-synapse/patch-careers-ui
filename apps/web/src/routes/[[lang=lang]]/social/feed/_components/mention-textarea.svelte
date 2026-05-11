<!--
  MentionTextarea — textarea with @mention autocomplete. When the user types
  "@" followed by >=1 char, opens a popover listing up to 6 matching users;
  Enter/click inserts "@username ". Arrow keys navigate.

  MVP scope:
  - Uses the existing /v1/search endpoint for people lookup, debounced 150ms.
  - Stores matched usernames as `@username` in the plain-text value (server
    parses them later — we keep the payload human-readable).
  - No rich text, no avatars inline in the textarea — caret positioning is
    transparent to the user, which is enough for a first pass.
-->
<script lang="ts">
import { getV1Search } from 'api-client';
import { AtSign } from 'lucide-svelte';

interface MentionCandidate {
  userId: string;
  username: string | null;
  name: string | null;
  photoURL?: string | null;
}

interface Props {
  value: string;
  placeholder?: string;
  rows?: number;
  id?: string;
  disabled?: boolean;
  /** Called on blur/submit so the parent can persist. */
  oninput?: (value: string) => void;
}

let { value = $bindable(''), placeholder, rows = 4, id, disabled, oninput }: Props = $props();

let textarea: HTMLTextAreaElement | null = $state(null);
let showPopover = $state(false);
let candidates = $state<MentionCandidate[]>([]);
let activeIndex = $state(0);
let mentionStart = $state(0);
let currentQuery = $state('');
let debounce: ReturnType<typeof setTimeout> | null = null;

async function fetchCandidates(query: string) {
  if (!query) {
    candidates = [];
    return;
  }
  try {
    const body = await getV1Search({ q: query, limit: 6, sortBy: 'relevance' });
    candidates = body.items.map((r) => ({
      userId: r.userId,
      username: r.slug,
      name: r.fullName,
    }));
    activeIndex = 0;
  } catch {
    candidates = [];
  }
}

function detectMention() {
  if (!textarea) return;
  const caret = textarea.selectionStart ?? value.length;
  const before = value.slice(0, caret);
  const match = /(^|\s)@([\w-]{0,30})$/.exec(before);
  if (!match) {
    showPopover = false;
    candidates = [];
    return;
  }
  mentionStart = caret - match[2].length;
  currentQuery = match[2];
  showPopover = true;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    if (currentQuery.length >= 1) void fetchCandidates(currentQuery);
    else candidates = [];
  }, 150);
}

function insertMention(candidate: MentionCandidate) {
  if (!textarea || !candidate.username) return;
  const caret = textarea.selectionStart ?? value.length;
  const before = value.slice(0, mentionStart);
  const after = value.slice(caret);
  const insert = `${candidate.username} `;
  value = `${before}${insert}${after}`;
  oninput?.(value);
  showPopover = false;
  candidates = [];
  requestAnimationFrame(() => {
    if (!textarea) return;
    const pos = before.length + insert.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
}

function onKeyDown(e: KeyboardEvent) {
  if (!showPopover || candidates.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % candidates.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = (activeIndex - 1 + candidates.length) % candidates.length;
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    insertMention(candidates[activeIndex]);
  } else if (e.key === 'Escape') {
    showPopover = false;
  }
}
</script>

<div class="relative">
  <textarea
    bind:this={textarea}
    bind:value
    {id}
    {placeholder}
    {rows}
    {disabled}
    oninput={(e) => {
      value = (e.currentTarget as HTMLTextAreaElement).value;
      oninput?.(value);
      detectMention();
    }}
    onkeydown={onKeyDown}
    class="block w-full rounded-md border border-gray-200 bg-white p-3 text-sm outline-none focus:border-cyan-500 dark:border-neutral-700 dark:bg-neutral-800"
  ></textarea>

  {#if showPopover && candidates.length > 0}
    <ul
      class="absolute left-0 top-full z-50 mt-1 w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      role="listbox"
      aria-label="Menções"
    >
      {#each candidates as c, i (c.userId)}
        <li>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors
              {i === activeIndex
              ? 'bg-cyan-500/10 text-gray-900 dark:text-neutral-100'
              : 'hover:bg-gray-50 dark:hover:bg-neutral-800'}"
            onclick={() => insertMention(c)}
            role="option"
            aria-selected={i === activeIndex}
          >
            <AtSign size={14} class="text-gray-400" />
            <span class="font-medium">{c.username ?? '—'}</span>
            {#if c.name}
              <span class="text-xs text-gray-500 dark:text-neutral-500">· {c.name}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
