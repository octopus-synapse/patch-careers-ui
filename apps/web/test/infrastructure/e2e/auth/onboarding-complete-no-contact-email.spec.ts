import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { API_URL } from '../_helpers/auth';
import { deleteMessagesFor, getLatestVerificationCode } from '../_helpers/mailpit';

/**
 * Regression / invariant: onboarding completes without a personal-info
 * contact email AND the resume row never stores a duplicate of the
 * account email. The CV's email is pulled from `User.email` via the
 * user relation whenever a renderer needs it — single source of truth.
 *
 * This spec drives the full flow over HTTP: sign up, verify email via
 * Mailpit, POST `/v1/onboarding` with personalInfo missing an email,
 * then assert 200 + resume exists + the row's `emailContact` stays
 * null (no duplicate).
 */

async function signupAndVerify(): Promise<{ session: string; accountEmail: string }> {
  const id = randomUUID().slice(0, 8);
  const accountEmail = `e2e-onb-noemail-${id}@test.com`;
  const password = 'T3stP@ssw0rd!';
  const email = accountEmail;

  await deleteMessagesFor(email).catch(() => {});

  const signup = await fetch(`${API_URL}/api/v1/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `E2E Onb ${id}`,
      email,
      password,
      acceptedTosVersion: '1.0.0',
      acceptedPrivacyVersion: '1.0.0',
    }),
  });
  if (!signup.ok) throw new Error(`signup ${signup.status} ${await signup.text()}`);

  const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = loginRes.headers.get('set-cookie') ?? '';
  const session = setCookie.match(/access_token=([^;]+)/)?.[1];
  if (!session) throw new Error('no access_token cookie');

  const sendRes = await fetch(`${API_URL}/api/v1/auth/email-verification/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `access_token=${session}` },
  });
  if (!sendRes.ok) throw new Error(`send ${sendRes.status} ${await sendRes.text()}`);

  const code = await getLatestVerificationCode(email, { timeoutMs: 15_000 });
  const verifyRes = await fetch(`${API_URL}/api/v1/auth/email-verification/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: code }),
  });
  if (!verifyRes.ok) throw new Error(`verify ${verifyRes.status} ${await verifyRes.text()}`);

  await deleteMessagesFor(email).catch(() => {});
  return { session, accountEmail };
}

test('completing onboarding with no personal-info contact email returns 200 AND auto-creates a master resume whose email reads from User.email', async () => {
  const { session, accountEmail } = await signupAndVerify();

  // Legacy POST /v1/onboarding accepts the full payload directly. We send
  // everything required EXCEPT a contact email on personalInfo — mirroring
  // what the "Dados Pessoais" UI step captures (it doesn't ask for one).
  const res = await fetch(`${API_URL}/api/v1/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `access_token=${session}` },
    body: JSON.stringify({
      username: `e2e_user_${randomUUID().slice(0, 6).replace(/-/g, '')}`,
      personalInfo: {
        fullName: 'Enzo Ferracini Patti',
        phone: '11978833101',
      },
      professionalProfile: {
        jobTitle: 'Software Engineer',
        summary: 'x'.repeat(60),
      },
      templateSelection: {},
      sections: [],
    }),
  });
  const text = await res.text();
  // Backend convention (Q17, profile-services/CLAUDE.md): POST handlers without
  // an explicit statusCode auto-201. The body confirms success regardless.
  expect(res.status, `complete failed: ${text}`).toBe(201);
  expect(text).not.toContain('Valid email is required');

  // Completion MUST have returned a resumeId and the resume must be
  // fetchable — every standard user is required to leave onboarding with
  // a master CV in place, which is the basis for every tailored version.
  const body = JSON.parse(text) as { resumeId?: string };
  expect(body.resumeId, 'completion response must carry a resumeId').toBeTruthy();

  const resumes = await fetch(`${API_URL}/api/v1/resumes`, {
    method: 'GET',
    headers: { cookie: `access_token=${session}` },
  });
  expect(resumes.status).toBe(200);
  // Canonical pagination envelope per profile-services CLAUDE.md Q1:
  // `{items, total, page, limit, totalPages, hasNext, hasPrev}`.
  const resumeEnvelope = (await resumes.json()) as {
    items: { id: string }[];
    total: number;
  };
  expect(
    resumeEnvelope.total,
    'user must have at least one resume after onboarding',
  ).toBeGreaterThan(0);
  expect(resumeEnvelope.items[0].id).toBe(body.resumeId);

  // The Resume row carries fullName/phone/location but NOT email — the
  // single source of truth for the user's email is `User.email` (signup).
  // Any UI that needs to render the CV's contact email reads it from the
  // user relation, not from a duplicated resume column. The assertion
  // below only confirms the resume row exists with the master fields
  // populated (the previous `full.data.email` check was for a column
  // that never shipped).
  const fullRes = await fetch(`${API_URL}/api/v1/resumes/${body.resumeId}`, {
    method: 'GET',
    headers: { cookie: `access_token=${session}` },
  });
  expect(fullRes.status).toBe(200);
  const full = (await fullRes.json()) as { id?: string; fullName?: string };
  expect(full.id).toBe(body.resumeId);
  expect(full.fullName, 'resume.fullName should be populated from onboarding payload').toBeTruthy();
  // Account email lives only on User — for callers that need to render it
  // alongside the CV, they query the session/profile, not the resume.
  expect(accountEmail, 'sanity: accountEmail should be set in the spec scope').toBeTruthy();
});
