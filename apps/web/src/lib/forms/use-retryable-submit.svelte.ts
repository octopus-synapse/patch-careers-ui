/**
 * useRetryableSubmit — Svelte 5 rune helper that wraps an async submit
 * function so the UI can show "Try again" after a failure without losing
 * the form payload.
 *
 * Usage:
 *   const submit = useRetryableSubmit(async (data) => await api.save(data));
 *   <button onclick={() => submit.run(formData)}>Salvar</button>
 *   {#if submit.error}
 *     <RetryBanner error={submit.error} retrying={submit.isRetrying} onretry={submit.retry} />
 *   {/if}
 */

export interface RetryableSubmit<T, R> {
  readonly isSubmitting: boolean;
  readonly isRetrying: boolean;
  readonly error: unknown;
  readonly lastInput: T | null;
  readonly lastResult: R | null;
  readonly attempts: number;
  run(input: T): Promise<R | null>;
  retry(): Promise<R | null>;
  reset(): void;
}

export function useRetryableSubmit<T, R>(
  fn: (input: T) => Promise<R>,
  options: { maxAttempts?: number } = {},
): RetryableSubmit<T, R> {
  const maxAttempts = options.maxAttempts ?? Infinity;

  let submitting = $state(false);
  let retrying = $state(false);
  let error = $state<unknown>(null);
  let lastInput = $state<T | null>(null);
  let lastResult = $state<R | null>(null);
  let attempts = $state(0);

  async function run(input: T): Promise<R | null> {
    lastInput = input;
    submitting = true;
    retrying = false;
    error = null;
    attempts = 0;
    return invoke(input);
  }

  async function retry(): Promise<R | null> {
    if (lastInput === null) return null;
    if (attempts >= maxAttempts) return null;
    retrying = true;
    error = null;
    return invoke(lastInput);
  }

  async function invoke(input: T): Promise<R | null> {
    attempts += 1;
    try {
      const result = await fn(input);
      lastResult = result;
      return result;
    } catch (err) {
      error = err;
      return null;
    } finally {
      submitting = false;
      retrying = false;
    }
  }

  function reset() {
    submitting = false;
    retrying = false;
    error = null;
    lastInput = null;
    lastResult = null;
    attempts = 0;
  }

  return {
    get isSubmitting() {
      return submitting;
    },
    get isRetrying() {
      return retrying;
    },
    get error() {
      return error;
    },
    get lastInput() {
      return lastInput;
    },
    get lastResult() {
      return lastResult;
    },
    get attempts() {
      return attempts;
    },
    run,
    retry,
    reset,
  };
}
