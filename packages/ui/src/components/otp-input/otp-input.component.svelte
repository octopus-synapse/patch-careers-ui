<script lang="ts">
import { untrack } from 'svelte';

type Props = {
  /** Current code value — a string up to `length` characters. */
  value: string;
  /** Number of digit slots. Default 6. */
  length?: number;
  /** Fires when the user finishes typing (all `length` slots filled). */
  oncomplete?: (code: string) => void;
  /** Fires on every change. */
  onchange?: (code: string) => void;
  /** Visually marks the component as errored (red border + shake). */
  error?: boolean;
  /** Disable input (submitting, etc.). */
  disabled?: boolean;
  /** Auto-focus the first slot on mount. */
  autofocus?: boolean;
  /** aria-label for the whole group (e.g. "Verification code"). */
  groupAriaLabel: string;
  /** Per-slot aria-label as `(index) => label` — 1-based. */
  digitAriaLabel: (index: number) => string;
};

let {
  value = $bindable(''),
  length = 6,
  oncomplete,
  onchange,
  error = false,
  disabled = false,
  autofocus = false,
  groupAriaLabel,
  digitAriaLabel,
}: Props = $props();

const slots = $derived(Array.from({ length }, (_, i) => value[i] ?? ''));

let inputs: HTMLInputElement[] = $state([]);
let shake = $state(false);

$effect(() => {
  if (error) {
    shake = true;
    const t = setTimeout(() => (shake = false), 500);
    return () => clearTimeout(t);
  }
});

$effect(() => {
  if (!autofocus) return;
  untrack(() => {
    setTimeout(() => inputs[0]?.focus(), 50);
  });
});

function setValue(next: string) {
  const sanitized = next.replace(/\D/g, '').slice(0, length);
  if (sanitized === value) return;
  value = sanitized;
  onchange?.(sanitized);
  if (sanitized.length === length) oncomplete?.(sanitized);
}

function handleInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const digit = input.value.replace(/\D/g, '').slice(-1);

  if (!digit) {
    // User cleared this slot; rebuild value without it.
    const next = value.slice(0, index) + value.slice(index + 1);
    setValue(next);
    return;
  }

  const next = value.slice(0, index) + digit + value.slice(index + 1);
  setValue(next);

  if (index < length - 1) {
    inputs[index + 1]?.focus();
    inputs[index + 1]?.select();
  } else {
    input.blur();
  }
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    if (slots[index]) return; // delete the current slot via native input
    // Slot is already empty — jump back.
    event.preventDefault();
    if (index > 0) {
      const next = value.slice(0, index - 1);
      setValue(next);
      inputs[index - 1]?.focus();
      inputs[index - 1]?.select();
    }
    return;
  }
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    inputs[index - 1]?.focus();
    inputs[index - 1]?.select();
    return;
  }
  if (event.key === 'ArrowRight' && index < length - 1) {
    event.preventDefault();
    inputs[index + 1]?.focus();
    inputs[index + 1]?.select();
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData('text') ?? '';
  const sanitized = text.replace(/\D/g, '').slice(0, length);
  if (!sanitized) return;
  setValue(sanitized);
  const nextFocusIdx = Math.min(sanitized.length, length - 1);
  inputs[nextFocusIdx]?.focus();
  inputs[nextFocusIdx]?.select();
}
</script>

<div
	class="flex justify-center gap-2 sm:gap-3 {shake ? 'animate-[otp-shake_0.4s_ease-in-out]' : ''}"
	role="group"
	aria-label={groupAriaLabel}
>
	{#each slots as digit, i}
		<input
			bind:this={inputs[i]}
			type="text"
			inputmode="numeric"
			autocomplete="one-time-code"
			maxlength="1"
			value={digit}
			disabled={disabled}
			aria-label={digitAriaLabel(i + 1)}
			oninput={(e) => handleInput(i, e)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={handlePaste}
			onfocus={(e) => (e.target as HTMLInputElement).select()}
			class="h-12 w-10 sm:h-14 sm:w-12 rounded-lg border text-center text-xl font-semibold tabular-nums text-gray-800 dark:text-neutral-100 outline-none transition-colors
				{error
					? 'border-red-500 bg-red-50 dark:bg-red-950/30 focus-visible:ring-2 focus-visible:ring-red-500'
					: 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-visible:border-gray-800 dark:focus-visible:border-neutral-200 focus-visible:ring-2 focus-visible:ring-gray-800/20 dark:focus-visible:ring-neutral-200/20'}
				{disabled ? 'opacity-50 cursor-not-allowed' : ''}"
		/>
	{/each}
</div>

