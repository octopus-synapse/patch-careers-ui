/**
 * Domain-aliased re-exports of social SDK types.
 *
 * Components import `Follower` / `Following` / `Connection` / etc. from
 * here instead of poking inside `GetV1...200['items'][number]` of the
 * generated SDK. When the backend renames a route or reshapes a type,
 * only this file changes — call sites stay untouched.
 */

export type {
  GetV1UsersMeConnections200 as ConnectionsPage,
  GetV1UsersMeConnectionsPending200 as PendingConnectionsPage,
  GetV1UsersMeConnectionsSent200 as SentConnectionsPage,
  GetV1UsersMeConnectionsSuggestions200 as ConnectionSuggestionsPage,
  GetV1UsersMeNetworkSummary200 as NetworkSummary,
  GetV1UsersUserIdFollowers200 as FollowersPage,
  GetV1UsersUserIdFollowing200 as FollowingPage,
} from 'api-client';

import type {
  GetV1UsersMeConnections200,
  GetV1UsersMeConnectionsPending200,
  GetV1UsersMeConnectionsSent200,
  GetV1UsersMeConnectionsSuggestions200,
  GetV1UsersUserIdFollowers200,
  GetV1UsersUserIdFollowing200,
} from 'api-client';

export type Follower = GetV1UsersUserIdFollowers200['items'][number];
export type Following = GetV1UsersUserIdFollowing200['items'][number];
export type Connection = GetV1UsersMeConnections200['items'][number];
export type PendingConnection = GetV1UsersMeConnectionsPending200['items'][number];
export type SentConnection = GetV1UsersMeConnectionsSent200['items'][number];
export type ConnectionSuggestion = GetV1UsersMeConnectionsSuggestions200['items'][number];
