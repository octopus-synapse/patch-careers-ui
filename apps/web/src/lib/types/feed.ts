/**
 * Domain-aliased re-exports of feed SDK types.
 *
 * Components import `Post` / `Notification` / etc. from here instead of
 * poking inside `GetV1Feed200['items'][number]`. When the backend
 * renames a route or reshapes a type, only this file changes.
 */

export type {
  GetV1Feed200 as FeedPage,
  GetV1FeedBookmarks200 as FeedBookmarksPage,
  GetV1Notifications200 as NotificationsPage,
} from 'api-client';

import type { GetV1Feed200, GetV1FeedBookmarks200, GetV1Notifications200 } from 'api-client';

export type Post = GetV1Feed200['items'][number];
export type FeedBookmark = GetV1FeedBookmarks200['items'][number];
export type Notification = GetV1Notifications200['items'][number];
