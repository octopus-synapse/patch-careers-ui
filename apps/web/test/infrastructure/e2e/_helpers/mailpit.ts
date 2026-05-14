/**
 * Mailpit test helper.
 *
 * The dev stack runs a Mailpit web UI at localhost:18025 that captures
 * every email sent by the backend. Verification emails include a 6-digit
 * OTP embedded in the body (snippet preview already exposes it). Tests use
 * this helper to advance a freshly-signed-up user through the email-verify
 * stage without screen-scraping the DB.
 *
 * Host port 18025 is the project-unique mapping from `docker-compose.dev.yml`
 * (container's port 8025 is unchanged). Override with `MAILPIT_URL` env
 * when running against a different stack.
 */

const MAILPIT_BASE = process.env.MAILPIT_URL ?? 'http://localhost:18025';

type MailpitMessage = {
  ID: string;
  Subject: string;
  Snippet: string;
  Created: string;
  To: { Address: string }[];
};

type MailpitListResponse = {
  messages: MailpitMessage[];
};

async function fetchMessagesFor(email: string): Promise<MailpitMessage[]> {
  // Mailpit's search accepts `to:<email>` and falls back to substring.
  const query = encodeURIComponent(`to:${email}`);
  const res = await fetch(`${MAILPIT_BASE}/api/v1/search?query=${query}&limit=10`);
  if (!res.ok) throw new Error(`Mailpit search failed: HTTP ${res.status}`);
  const body = (await res.json()) as MailpitListResponse;
  return body.messages ?? [];
}

/**
 * Return the 6-digit code from the most recent "Verifique seu email"
 * message addressed to `email`. Polls briefly since the backend enqueues
 * the send and SMTP delivery has a small lag.
 */
export async function getLatestVerificationCode(
  email: string,
  { timeoutMs = 10_000, intervalMs = 300 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const messages = await fetchMessagesFor(email);
    const verify = messages
      .filter((m) => /verif/i.test(m.Subject))
      .sort((a, b) => b.Created.localeCompare(a.Created))[0];
    if (verify) {
      const match = verify.Snippet.match(/(\d{6})/);
      if (match) return match[1];
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`No verification email for ${email} within ${timeoutMs}ms`);
}

/** Delete every message addressed to this recipient — keeps test runs independent. */
export async function deleteMessagesFor(email: string): Promise<void> {
  const messages = await fetchMessagesFor(email);
  if (messages.length === 0) return;
  await fetch(`${MAILPIT_BASE}/api/v1/messages`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ IDs: messages.map((m) => m.ID) }),
  });
}
