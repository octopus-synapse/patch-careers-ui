const API_URL = 'http://localhost:3001';

export default async function globalSetup() {
  // 1. Backend reachable? A 4xx/5xx still means the server is up; only connection
  // failures should fail the setup.
  try {
    await fetch(`${API_URL}/`, { signal: AbortSignal.timeout(3000) });
  } catch (err) {
    throw new Error(
      `[e2e] Backend not reachable at ${API_URL}. Start it (bun run dev in the backend repo) before running e2e.\n` +
        `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 2. Seed user 'enzoferracini' present? (required by resume-download.spec.ts)
  try {
    const res = await fetch(`${API_URL}/api/v1/profiles/enzoferracini`);
    if (res.status === 404) {
      console.warn(
        `[e2e] Seed user 'enzoferracini' is missing in the backend DB. ` +
          `resume-download.spec.ts will fail until the backend migration that seeds this user runs.`,
      );
    } else if (!res.ok) {
      console.warn(`[e2e] Unexpected status ${res.status} when checking enzoferracini profile.`);
    }
  } catch (err) {
    console.warn(
      `[e2e] Could not check enzoferracini seed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
