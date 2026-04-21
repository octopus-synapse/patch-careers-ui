<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

type Props = {
  password: string;
};

let { password }: Props = $props();

const t = $derived(locale.t);

// Score 0-4 based on simple heuristics. Not a replacement for zxcvbn —
// goal is direction ("add a number, add a symbol"), not true entropy.
const score = $derived.by(() => {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s++;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
  if (/\d/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  return Math.min(s, 4);
});

const missing = $derived.by(() => {
  const hints: string[] = [];
  if (password.length < 8) hints.push(t('password.hints.length'));
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) hints.push(t('password.hints.case'));
  if (!/\d/.test(password)) hints.push(t('password.hints.digit'));
  if (!/[^A-Za-z0-9]/.test(password)) hints.push(t('password.hints.symbol'));
  return hints;
});

const segmentColor = $derived((i: number) => {
  if (i >= score) return 'bg-gray-200 dark:bg-neutral-800';
  if (score === 1) return 'bg-red-500';
  if (score === 2) return 'bg-orange-500';
  if (score === 3) return 'bg-yellow-500';
  return 'bg-emerald-500';
});

const label = $derived.by(() => {
  if (!password) return '';
  if (score <= 1) return t('password.strength.weak');
  if (score === 2) return t('password.strength.fair');
  if (score === 3) return t('password.strength.good');
  return t('password.strength.strong');
});
</script>

{#if password}
	<div class="mt-2">
		<div class="flex gap-1">
			{#each [0, 1, 2, 3] as i}
				<span class="h-1 flex-1 rounded transition-colors {segmentColor(i)}"></span>
			{/each}
		</div>
		<div class="mt-1 flex items-center justify-between gap-2">
			<span class="text-xs text-gray-600 dark:text-neutral-400">{label}</span>
			{#if missing.length > 0}
				<span class="truncate text-[11px] text-gray-500 dark:text-neutral-500">
					{t('password.hintsPrefix')} {missing.join(', ')}
				</span>
			{/if}
		</div>
	</div>
{/if}
