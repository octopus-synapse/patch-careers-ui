/**
 * Domain-aliased re-exports of resume SDK types.
 *
 * Components import `Resume` / `ResumeSection` / etc. from here instead
 * of poking inside `GetV1Resumes200['items'][number]`. When the backend
 * renames a route or reshapes a type, only this file changes.
 */

export type {
  GetV1Resumes200 as ResumesPage,
  GetV1ResumesResumeId200 as ResumeFull,
} from 'api-client';

import type { GetV1Resumes200 } from 'api-client';

export type Resume = GetV1Resumes200['items'][number];
