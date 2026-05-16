<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

type Props = {
  password: string;
};

let { password }: Props = $props();

const t = $derived(locale.t);

// MUST match the backend regex in profile-services
// `shared-kernel/schemas/primitives/password.schema.ts` (PASSWORD_POLICY.specialChars).
// The OpenAPI envelope flattens those four `.regex()` calls into a single
// combined pattern, so the generated zod schema can't carry per-rule
// messages — this component is the one user-facing surface that
// reproduces the rule set. Drift here = user sees "Senha forte" and
// then the submit fails on a rule they were never warned about.
const SYMBOL_RX = /[@$!%*?&]/;

const checks = $derived({
  length: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  digit: /\d/.test(password),
  symbol: SYMBOL_RX.test(password),
});

const passed = $derived(Object.values(checks).filter(Boolean).length);

// 5 rules clamped into 4 segments. All-pass keeps the bar fully green;
// any failure caps the score so the user never sees "strong" while a
// requirement is still missing.
const score = $derived.by(() => {
  if (!password) return 0;
  if (passed < 5) return Math.min(passed, 3);
  return 4;
});

const missing = $derived.by(() => {
  const hints: string[] = [];
  if (!checks.length) hints.push(t('password.hints.length'));
  if (!checks.upper || !checks.lower) hints.push(t('password.hints.case'));
  if (!checks.digit) hints.push(t('password.hints.digit'));
  if (!checks.symbol) hints.push(t('password.hints.symbol'));
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
