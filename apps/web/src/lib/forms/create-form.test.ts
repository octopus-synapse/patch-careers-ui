import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createForm } from './create-form.svelte';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Input = z.infer<typeof schema>;

function mockMutation() {
  const mutate = vi.fn<(args: { data: Input }) => void>();
  return {
    mutate,
    isPending: false,
  };
}

describe('createForm', () => {
  it('populates field errors and skips mutation when validation fails', () => {
    const mutation = mockMutation();
    const form = createForm({
      schema,
      initial: { email: '', password: '' },
      mutation,
    });

    form.values.email = 'not-an-email';
    form.values.password = 'short';

    const ok = form.submit();

    expect(ok).toBe(false);
    expect(mutation.mutate).not.toHaveBeenCalled();
    expect(form.errors.email).toBeTruthy();
    expect(form.errors.password).toBeTruthy();
  });

  it('calls mutation with parsed data when validation passes', () => {
    const mutation = mockMutation();
    const form = createForm({
      schema,
      initial: { email: '', password: '' },
      mutation,
    });

    form.values.email = 'user@example.com';
    form.values.password = 'longenough';

    const ok = form.submit();

    expect(ok).toBe(true);
    expect(mutation.mutate).toHaveBeenCalledWith({
      data: { email: 'user@example.com', password: 'longenough' },
    });
    expect(form.errors).toEqual({});
  });

  it('exposes submission state from the mutation', () => {
    const mutation = { mutate: vi.fn(), isPending: true };
    const form = createForm({
      schema,
      initial: { email: '', password: '' },
      mutation,
    });

    expect(form.isSubmitting).toBe(true);
  });

  it('setFieldError adds a server-side error without clearing others', () => {
    const mutation = mockMutation();
    const form = createForm({
      schema,
      initial: { email: '', password: '' },
      mutation,
    });

    form.submit();
    expect(form.errors.email).toBeTruthy();

    form.setFieldError('email', 'Email already in use');
    expect(form.errors.email).toBe('Email already in use');
    expect(form.errors.password).toBeTruthy();
  });

  it('reset restores initial values and clears errors', () => {
    const mutation = mockMutation();
    const form = createForm({
      schema,
      initial: { email: 'default@example.com', password: '' },
      mutation,
    });

    form.values.email = 'other@example.com';
    form.submit();
    expect(form.errors.password).toBeTruthy();

    form.reset();

    expect(form.values.email).toBe('default@example.com');
    expect(form.values.password).toBe('');
    expect(form.errors).toEqual({});
  });
});
