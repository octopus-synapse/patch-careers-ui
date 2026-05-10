/**
 * Domain-aliased re-exports of jobs SDK types.
 *
 * Components import `Job` / `JobApplication` / `JobBookmark` from here
 * instead of poking inside `GetV1Jobs200['items'][number]`. When the
 * backend renames a route or reshapes a type, only this file changes.
 */

export type {
  GetV1Jobs200 as JobsPage,
  GetV1JobsApplications200 as JobApplicationsPage,
  GetV1JobsBookmarks200 as JobBookmarksPage,
  GetV1JobsMine200 as MyJobsPage,
  GetV1JobsRecommended200 as RecommendedJobsPage,
  GetV1JobsWithFitScore200 as JobsWithFitScorePage,
} from 'api-client';

import type {
  GetV1Jobs200,
  GetV1JobsApplications200,
  GetV1JobsBookmarks200,
  GetV1JobsMine200,
  GetV1JobsRecommended200,
  GetV1JobsWithFitScore200,
} from 'api-client';

export type Job = GetV1Jobs200['items'][number];
export type JobBookmark = GetV1JobsBookmarks200['items'][number];
export type RecommendedJob = GetV1JobsRecommended200['items'][number];
export type JobWithFitScore = GetV1JobsWithFitScore200['items'][number];
export type MyJob = GetV1JobsMine200['items'][number];
export type JobApplication = GetV1JobsApplications200['items'][number];
