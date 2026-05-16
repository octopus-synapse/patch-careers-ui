<script lang="ts">
import { getV1UsersUsernameCheck } from 'api-client';
import type { GetV1UsersUsernameCheck200ReasonEnumKey } from 'api-client';
import { Button, Input, Label, Textarea } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type Field = {
  key: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  widget?: string;
  examples?: string[];
};

type Props = {
  field: Field;
  value: string;
  onchange: (value: string) => void;
  error?: string;
  // 'warning' = soft amber hint (typing in progress); 'error' = red,
  // shown once the user has tried to advance without satisfying the
  // schema. Default matches legacy callers that always treated `error`
  // as hard.
  severity?: 'warning' | 'error';
};

let { field, value, onchange, error, severity = 'error' }: Props = $props();

const isWarning = $derived(severity === 'warning');
const borderClass = $derived(
  error
    ? isWarning
      ? 'border-amber-400 dark:border-amber-500'
      : 'border-red-500 dark:border-red-400'
    : '',
);
const messageClass = $derived(
  isWarning
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400',
);

let usernameAvailable = $state<boolean | null>(null);
let usernameReason = $state<GetV1UsersUsernameCheck200ReasonEnumKey | null>(null);
let usernameCheckTimeout: ReturnType<typeof setTimeout> | null = null;

function checkUsername(val: string) {
  if (usernameCheckTimeout) clearTimeout(usernameCheckTimeout);
  usernameAvailable = null;
  usernameReason = null;
  if (!val || val.length < 3) return;
  usernameCheckTimeout = setTimeout(async () => {
    try {
      const res = await getV1UsersUsernameCheck({ username: val });
      usernameAvailable = res.available;
      usernameReason = res.reason ?? null;
    } catch {
      usernameAvailable = null;
      usernameReason = null;
    }
  }, 500);
}

const unavailableLabel: Record<GetV1UsersUsernameCheck200ReasonEnumKey, string> = {
  taken: '✗ Already taken',
  reserved: '✗ Reserved',
  invalid_format: '✗ Invalid format',
};

const examples = $derived(field.examples);
let exampleIndex = $state(0);
let focused = $state(false);
const placeholder = $derived(
  focused || !examples?.length ? '' : examples[exampleIndex % examples.length],
);

$effect(() => {
  if (!examples?.length) return;
  const interval = setInterval(() => {
    exampleIndex = (exampleIndex + 1) % examples.length;
  }, 5000);
  return () => clearInterval(interval);
});

const isSummary = $derived(field.type === 'textarea' || field.widget === 'textarea');
const summaryExamples = $derived(isSummary ? examples : undefined);
let showSummaryExamples = $state(false);

function inputType(fieldType: string): string {
  if (fieldType === 'email') return 'email';
  if (fieldType === 'url') return 'url';
  if (fieldType === 'number') return 'number';
  if (fieldType === 'date') return 'date';
  return 'text';
}
</script>

<div>
	<Label for={field.key}>
		{field.label}
	</Label>

	{#if isSummary}
		<Textarea
			id={field.key}
			{value}
			{placeholder}
			required={field.required}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			oninput={(e) => onchange(e.currentTarget.value)}
			rows={3}
			class="w-full resize-none rounded-none border-b bg-transparent py-2 text-sm {borderClass || 'border-gray-300 dark:border-neutral-700'} text-gray-900 placeholder:text-gray-500/50 focus:border-gray-900 dark:text-neutral-200 dark:placeholder:text-neutral-500/50 dark:focus:border-neutral-200"
		/>
		{#if summaryExamples?.length && !value}
			<Button
				type="button"
				variant="ghost"
				size="xs"
				onclick={() => (showSummaryExamples = !showSummaryExamples)}
			>
				{showSummaryExamples ? 'hide' : t('onboarding.fieldRenderer.seeExample')}
			</Button>
			{#if showSummaryExamples}
				<div class="mt-2 space-y-2">
					{#each summaryExamples as example}
						<p class="text-[11px] leading-relaxed text-gray-400 dark:text-neutral-500">{example}</p>
					{/each}
				</div>
			{/if}
		{/if}
	{:else if field.type === 'select' || (field.options && field.options.length > 0)}
		<select
			id={field.key}
			{value}
			required={field.required}
			onchange={(e) => onchange(e.currentTarget.value)}
			class="w-full rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all {borderClass || 'border-gray-300 dark:border-neutral-700'} text-gray-900 focus:border-gray-900 dark:text-neutral-200 dark:focus:border-neutral-200"
		>
			<option value="">---</option>
			{#if field.options}
				{#each field.options as opt}
					<option value={opt}>{opt}</option>
				{/each}
			{/if}
		</select>
	{:else}
		<Input
			id={field.key}
			type={inputType(field.type)}
			{value}
			{placeholder}
			required={field.required}
			class={borderClass}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			oninput={(e) => {
				onchange(e.currentTarget.value);
				if (field.key === 'username') checkUsername(e.currentTarget.value);
			}}
		/>
		{#if field.key === 'username' && usernameAvailable !== null}
			{#if usernameAvailable}
				<span class="text-xs text-emerald-500">✓ Available</span>
			{:else}
				<span class="text-xs text-red-500">{usernameReason ? unavailableLabel[usernameReason] : '✗ Unavailable'}</span>
			{/if}
		{/if}
	{/if}

	{#if error}
		<span class="text-xs {messageClass}">{error}</span>
	{/if}
</div>
