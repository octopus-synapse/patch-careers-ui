import type { GetV1JobsRecommended200 } from "@patch-careers/api-client";

/** One recommended listing: the external job shape + its 0–100 match score. */
export type RecommendedJob = GetV1JobsRecommended200["items"][number];
