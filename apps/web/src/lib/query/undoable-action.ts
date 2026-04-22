/**
 * undoableAction
 *
 * Wraps an optimistic mutation in a "fire now, undo within N seconds" UX.
 * The common case: user deletes a post / bookmark / comment, UI reflects
 * the delete immediately, a toast shows "Deleted — Undo". If the user
 * clicks Undo inside the window, `revert()` runs and `commit()` is skipped
 * entirely — the server never sees the delete. Otherwise `commit()` fires
 * when the window elapses.
 *
 * Why this pattern (vs. a blocking confirm dialog):
 *   - 95% of deletes are intentional. A confirm modal punishes the 95%
 *     to save the 5%.
 *   - For the 5% who misclick, undo is faster than re-opening the thing.
 *   - Keeps keyboard / muscle-memory users happy.
 *
 * For truly destructive actions (delete account, wipe resume), use
 * `DangerConfirmModal` instead — undo is not viable when the server
 * cascade-deletes related data.
 *
 * The helper is deliberately state-agnostic: it takes `apply` / `revert`
 * callbacks so callers can mutate local component state, `queryClient`
 * cache entries, or both — whichever makes sense for the caller.
 */

import { toastState } from 'ui';

export type UndoableActionParams = {
  /** Runs immediately — the optimistic update. */
  apply: () => void;
  /** Runs if the user clicks Undo inside the window. Should be the exact inverse of `apply`. */
  revert: () => void;
  /** Fires when the window elapses without being cancelled. Must be idempotent. */
  commit: () => Promise<unknown>;
  /** Runs after a successful commit (e.g., cache invalidation). Optional. */
  onCommitted?: () => void;
  /** Toast message shown with the Undo button. */
  message: string;
  /** Label for the Undo button. Defaults to "Desfazer". */
  undoLabel?: string;
  /** How long the user has to undo, in ms. Defaults to 5000. */
  windowMs?: number;
  /** Message shown if `commit()` rejects. Defaults to "Falha ao salvar — alteração revertida". */
  errorMessage?: string;
};

/**
 * Optimistically apply a change and schedule its server commit with a
 * user-visible undo window. Returns a manual `cancel()` in case the caller
 * needs to cancel programmatically (e.g., component unmount).
 */
export function undoableAction(params: UndoableActionParams): { cancel: () => void } {
  const {
    apply,
    revert,
    commit,
    onCommitted,
    message,
    undoLabel = 'Desfazer',
    windowMs = 5000,
    errorMessage = 'Falha ao salvar — alteração revertida',
  } = params;

  apply();
  let cancelled = false;

  const timer = setTimeout(() => {
    if (cancelled) return;
    commit()
      .then(() => onCommitted?.())
      .catch(() => {
        revert();
        toastState.show(errorMessage, 'danger');
      });
  }, windowMs);

  function cancel() {
    if (cancelled) return;
    cancelled = true;
    clearTimeout(timer);
    revert();
  }

  toastState.show(message, 'success', {
    duration: windowMs,
    action: { label: undoLabel, onClick: cancel },
  });

  return { cancel };
}
