import type { ZodError, ZodType } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export interface FormMutation<TInput> {
  mutate: (args: { data: TInput }) => void;
  isPending: boolean;
}

export interface CreateFormOptions<TInput extends object, TMutation extends FormMutation<TInput>> {
  schema: ZodType<TInput>;
  initial: TInput;
  mutation: TMutation;
  transform?: (values: TInput) => TInput;
}

export function createForm<TInput extends object, TMutation extends FormMutation<TInput>>(
  opts: CreateFormOptions<TInput, TMutation>,
) {
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
    opts.mutation.mutate({ data: parsed.data });
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
      return opts.mutation.isPending;
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
