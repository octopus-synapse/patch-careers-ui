/**
 * What `GET /v1/profiles/{username}` actually returns.
 *
 * Worth naming explicitly, because the obvious assumption is wrong: this is
 * NOT a public mirror of `/profile`. It carries the user's public columns and
 * the master resume's METADATA — no sections, no items. So the page shows who
 * someone is and links out; it cannot render a resume, and trying to would
 * mean a second endpoint that does not exist yet.
 */

import type { GetV1ProfilesUsernameQueryResponse } from "@patch-careers/api-client";

export type PublicProfileResponse = GetV1ProfilesUsernameQueryResponse;
export type PublicProfileUser = PublicProfileResponse["user"];
export type PublicProfileResume = PublicProfileResponse["resume"];

/** One outbound link on the page, already labelled. */
export type PublicProfileLink = {
  key: string;
  label: string;
  url: string;
};
