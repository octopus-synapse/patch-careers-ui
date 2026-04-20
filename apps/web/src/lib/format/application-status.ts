/**
 * Single source of truth for rendering application-status enum values.
 *
 * The backend enum lives in profile-services (JobApplication.status). When a
 * new status lands there, only this file needs touching.
 *
 * Future improvement: hydrate `KNOWN_STATUSES` from the `/v1/enums` endpoint
 * at boot so the UI stops drifting from the schema entirely.
 */
import type { Translator } from 'i18n';

export type ApplicationStatusIntent = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const KNOWN_STATUSES = [
  'APPLIED',
  'IN_REVIEW',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type ApplicationStatus = (typeof KNOWN_STATUSES)[number];

const INTENT_BY_STATUS: Record<ApplicationStatus, ApplicationStatusIntent> = {
  APPLIED: 'neutral',
  IN_REVIEW: 'info',
  INTERVIEW: 'info',
  OFFER: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'warning',
};

const I18N_KEY_BY_STATUS: Record<ApplicationStatus, string> = {
  APPLIED: 'dashboard.statusApplied',
  IN_REVIEW: 'dashboard.statusInReview',
  INTERVIEW: 'dashboard.statusInterview',
  OFFER: 'dashboard.statusOffer',
  REJECTED: 'dashboard.statusRejected',
  WITHDRAWN: 'dashboard.statusWithdrawn',
};

function normalize(status: string | undefined | null): ApplicationStatus | null {
  if (!status) return null;
  const upper = status.toUpperCase();
  return (KNOWN_STATUSES as readonly string[]).includes(upper)
    ? (upper as ApplicationStatus)
    : null;
}

export function statusIntent(status: string | undefined | null): ApplicationStatusIntent {
  const normalized = normalize(status);
  return normalized ? INTENT_BY_STATUS[normalized] : 'neutral';
}

export function statusLabel(status: string | undefined | null, t: Translator): string {
  const normalized = normalize(status);
  // Unknown/new statuses fall back to a humanized form so the UI doesn't
  // render an empty cell when the backend ships a status we haven't mapped yet.
  if (!normalized) return (status ?? '').toLowerCase().replace(/_/g, ' ');
  return t(I18N_KEY_BY_STATUS[normalized]);
}
