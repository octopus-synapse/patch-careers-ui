/**
 * Global lockout state.
 *
 * Backend lockout responses (409) from the scoring subsystem arrive with
 * a stable `code` and we route them through this store so ONE modal
 * renders the user-facing explanation + CTA — no per-call boilerplate.
 *
 * Handled codes (profile-services):
 * - `fit_profile_required`            → /my-profile/fit-profile/questions
 * - `quality_score_below_threshold`   → /my-profile/scores (resume details)
 * - `style_below_ats_threshold`       → /my-profile/styles
 * - `style_score_regression`          → admin-only; still surfaces for admin UIs
 * - `style_not_editable`              → admin-only; system-style guard
 */

import { isApiError } from 'api-client';

export type LockoutCode =
  | 'fit_profile_required'
  | 'quality_score_below_threshold'
  | 'style_below_ats_threshold'
  | 'style_score_regression'
  | 'style_not_editable';

export interface LockoutInfo {
  readonly code: LockoutCode;
  readonly title: string;
  readonly body: string;
  readonly cta?: { label: string; href: string };
}

const LOCKOUT_COPY: Readonly<Record<LockoutCode, Omit<LockoutInfo, 'code'>>> = {
  fit_profile_required: {
    title: 'Fit Profile necessário',
    body: 'Responda o questionário de 25 perguntas para liberar o Match Score, tailor de currículo e auto-apply.',
    cta: { label: 'Responder questionário', href: '/my-profile/fit-profile/questions' },
  },
  quality_score_below_threshold: {
    title: 'Qualidade do currículo abaixo do mínimo',
    body: 'Seu currículo precisa atingir pelo menos 50/100 de Resume Quality para esta ação. Volte e complete as seções recomendadas.',
    cta: { label: 'Ver recomendações', href: '/my-profile/scores' },
  },
  style_below_ats_threshold: {
    title: 'Estilo abaixo do limiar ATS-safe',
    body: 'Esse estilo ficou abaixo do threshold ATS-safe (70/100) e não pode ser salvo.',
  },
  style_score_regression: {
    title: 'Score do estilo não pode regredir',
    body: 'A pontuação de estilo é monotônica — uma versão nova precisa ter score igual ou maior que a anterior.',
  },
  style_not_editable: {
    title: 'Estilo do sistema',
    body: 'Estilos marcados como do sistema não podem ser editados ou excluídos por aqui.',
  },
};

/** Reactive Svelte 5 store for the one-at-a-time lockout modal. */
export const lockoutStore = $state<{ current: LockoutInfo | null }>({ current: null });

export function openLockout(code: LockoutCode): void {
  lockoutStore.current = { code, ...LOCKOUT_COPY[code] };
}

export function dismissLockout(): void {
  lockoutStore.current = null;
}

/** Narrow an unknown error to a LockoutCode. Returns null when it's
 *  not a recognised scoring lockout (so the fallback toast/error
 *  surfaces kick in). */
export function extractLockoutCode(err: unknown): LockoutCode | null {
  if (!isApiError(err)) return null;
  if (err.statusCode !== 409) return null;
  if (typeof err.code !== 'string') return null;
  if (
    err.code === 'fit_profile_required' ||
    err.code === 'quality_score_below_threshold' ||
    err.code === 'style_below_ats_threshold' ||
    err.code === 'style_score_regression' ||
    err.code === 'style_not_editable'
  ) {
    return err.code;
  }
  return null;
}
