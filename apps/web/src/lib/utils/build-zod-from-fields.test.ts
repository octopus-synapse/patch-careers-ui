import { describe, expect, it } from 'vitest';
import { buildZodFromFields } from './build-zod-from-fields';

describe('buildZodFromFields', () => {
  it('validates required fields', () => {
    const schema = buildZodFromFields([
      { key: 'name', type: 'text', label: 'Name', required: true },
    ]);

    expect(schema.safeParse({ name: '' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Alice' }).success).toBe(true);
  });

  it('allows empty string for optional fields', () => {
    const schema = buildZodFromFields([
      { key: 'nickname', type: 'text', label: 'Nickname', required: false },
    ]);

    expect(schema.safeParse({ nickname: '' }).success).toBe(true);
    expect(schema.safeParse({ nickname: 'Al' }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('validates email format', () => {
    const schema = buildZodFromFields([
      { key: 'email', type: 'email', label: 'Email', required: true },
    ]);

    expect(schema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(schema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('validates url format', () => {
    const schema = buildZodFromFields([
      { key: 'site', type: 'url', label: 'Website', required: true },
    ]);

    expect(schema.safeParse({ site: 'example.com' }).success).toBe(false);
    expect(schema.safeParse({ site: 'https://example.com' }).success).toBe(true);
  });

  it('enforces minLength and maxLength', () => {
    const schema = buildZodFromFields([
      {
        key: 'username',
        type: 'text',
        label: 'Username',
        required: true,
        minLength: 3,
        maxLength: 10,
      },
    ]);

    expect(schema.safeParse({ username: 'ab' }).success).toBe(false);
    expect(schema.safeParse({ username: 'abcdefghijk' }).success).toBe(false);
    expect(schema.safeParse({ username: 'valid' }).success).toBe(true);
  });

  it('enforces regex pattern', () => {
    const schema = buildZodFromFields([
      { key: 'slug', type: 'text', label: 'Slug', required: true, pattern: '^[a-z0-9-]+$' },
    ]);

    expect(schema.safeParse({ slug: 'With Space' }).success).toBe(false);
    expect(schema.safeParse({ slug: 'valid-slug-1' }).success).toBe(true);
  });

  it('validates a realistic personal-info step', () => {
    const schema = buildZodFromFields([
      { key: 'fullName', type: 'text', label: 'Full Name', required: true, minLength: 2 },
      { key: 'email', type: 'email', label: 'Email', required: true },
      { key: 'phone', type: 'text', label: 'Phone', required: false },
    ]);

    const result = schema.safeParse({ fullName: 'A', email: 'bad', phone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.fullName).toBeTruthy();
      expect(errors.email).toBeTruthy();
      expect(errors.phone).toBeFalsy();
    }

    expect(
      schema.safeParse({ fullName: 'Alice', email: 'alice@example.com', phone: '' }).success,
    ).toBe(true);
  });
});
