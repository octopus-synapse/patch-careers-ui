import { useCallback, useState } from "react";

/**
 * Wraps an async submit with a single `submitting` flag — the
 * `setSubmitting(true)` / try / `finally setSubmitting(false)` envelope
 * every auth screen was hand-rolling. `run` manages only the flag; the
 * handler owns its own success/error branches (it must not throw past
 * its own try/catch if it wants to surface a toast).
 */
export function useSubmit(): {
  submitting: boolean;
  run: (handler: () => Promise<void>) => Promise<void>;
} {
  const [submitting, setSubmitting] = useState(false);

  const run = useCallback(async (handler: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await handler();
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, run };
}
