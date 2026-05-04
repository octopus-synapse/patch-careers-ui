import type { Readable } from 'svelte/store';
import { get } from 'svelte/store';
import type { ZodError, ZodType, ZodTypeDef } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export interface FormMutation<TInput> {
  mutate: (args: { data: TInput }) => void;
  isPending: boolean;
}

/**
 * createForm accepts either a plain mutation object or a svelte-query v5
 * `Readable<MutationResult>` (returned by Kubb hooks). The latter is
 * auto-unwrapped via `get()`, so callers don't need to subscribe manually.
 */
export type FormMutationInput<TInput> = FormMutation<TInput> | Readable<FormMutation<TInput>>;

function unwrap<TInput>(m: FormMutationInput<TInput>): FormMutation<TInput> {
  if ('subscribe' in m && typeof (m as Readable<FormMutation<TInput>>).subscribe === 'function') {
    return get(m as Readable<FormMutation<TInput>>);
  }
  return m as FormMutation<TInput>;
}

export interface CreateFormOptions<TInput extends object> {
  // 3-generic ZodType so `_input` can be `unknown` (Kubb generates schemas
  // with `.passthrough()` whose input shape is loosely typed). Only the
  // `_output` matters for our submission flow.
  // biome-ignore lint/suspicious/noExplicitAny: passthrough schemas have any input
  schema: ZodType<TInput, ZodTypeDef, any>;
  initial: TInput;
  mutation: FormMutationInput<TInput>;
  transform?: (values: TInput) => TInput;
}

export function createForm<TInput extends object>(opts: CreateFormOptions<TInput>) {
  const values = $state<TInput>({ ...opts.initial });
  let errors = $state<FieldErrors<TInput>>({});

  function submit(): boolean {
    errors = {};
    const snapshot = opts.transform ? opts.transform({ ...values }) : values;
    const parsed = opts.schema.safeParse(snapshot);
    if (!parsed.success) {
      errors = flattenZodErrors<TInput>(parsed.error);
      return false;
    }
    unwrap(opts.mutation).mutate({ data: parsed.data });
    return true;
  }

  function reset(): void {
    for (const key of Object.keys(values) as Array<keyof TInput>) {
      delete (values as Record<keyof TInput, unknown>)[key];
    }
    Object.assign(values, opts.initial);
    errors = {};
  }

  function setFieldError(field: keyof TInput, message: string): void {
    errors = { ...errors, [field]: message };
  }

  function clearErrors(): void {
    errors = {};
  }

  return {
    values,
    get errors() {
      return errors;
    },
    get isSubmitting() {
      return unwrap(opts.mutation).isPending;
    },
    submit,
    reset,
    setFieldError,
    clearErrors,
  };
}

function flattenZodErrors<T>(err: ZodError): FieldErrors<T> {
  const flat = err.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages && messages.length > 0) {
      result[key] = messages[0];
    }
  }
  return result as FieldErrors<T>;
}
