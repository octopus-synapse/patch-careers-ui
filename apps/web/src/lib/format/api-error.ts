/**
 * Pull a user-safe message + suggested action from a profile-services error
 * response. Backend ships an envelope shaped like:
 *
 *   {
 *     success: false,
 *     error: {
 *       code, message, userMessage?, action?: 'redirect:/login'|'retry'|'toast'|'highlight-fields',
 *       details?
 *     }
 *   }
 *
 * `userMessage` is the localized copy the UI can show in a toast directly
 * without knowing the error code; `action` tells the UI whether to redirect,
 * surface a retry, or just toast.
 *
 * Use this instead of building toast strings from `err.message` so future
 * backend copy changes flow through automatically.
 */
export type ApiErrorAction =
  | { kind: 'redirect'; to: string }
  | { kind: 'retry' }
  | { kind: 'highlight-fields' }
  | { kind: 'toast' };

export interface ParsedApiError {
  message: string;
  code?: string;
  action: ApiErrorAction;
  details?: Record<string, unknown>;
}

export async function parseApiError(
  res: Response,
  fallbackMessage: string,
): Promise<ParsedApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { message: fallbackMessage, action: actionFromStatus(res.status) };
  }
  return parseApiErrorBody(body, fallbackMessage, res.status);
}

export function parseApiErrorBody(
  body: unknown,
  fallbackMessage: string,
  status?: number,
): ParsedApiError {
  if (!body || typeof body !== 'object') {
    return { message: fallbackMessage, action: actionFromStatus(status) };
  }
  const err = (body as { error?: unknown }).error;
  if (!err || typeof err !== 'object') {
    return { message: fallbackMessage, action: actionFromStatus(status) };
  }
  const e = err as Record<string, unknown>;
  const message =
    typeof e.userMessage === 'string'
      ? e.userMessage
      : typeof e.message === 'string'
        ? e.message
        : fallbackMessage;
  const code = typeof e.code === 'string' ? e.code : undefined;
  const action = parseAction(typeof e.action === 'string' ? e.action : undefined, status);
  const details =
    e.details && typeof e.details === 'object' ? (e.details as Record<string, unknown>) : undefined;
  return { message, code, action, details };
}

function parseAction(raw: string | undefined, status?: number): ApiErrorAction {
  if (!raw) return actionFromStatus(status);
  if (raw.startsWith('redirect:')) {
    return { kind: 'redirect', to: raw.slice('redirect:'.length) };
  }
  if (raw === 'retry') return { kind: 'retry' };
  if (raw === 'highlight-fields') return { kind: 'highlight-fields' };
  return { kind: 'toast' };
}

function actionFromStatus(status?: number): ApiErrorAction {
  if (status === 401) return { kind: 'redirect', to: '/login' };
  if (status && status >= 500) return { kind: 'retry' };
  return { kind: 'toast' };
}
