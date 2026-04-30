export type FitDimension = {
  /** Stable identifier used only to key the list. */
  key: string;
  /** Human label already localized by the caller. */
  label: string;
  /** 0–100 fraction met in this dimension. */
  value: number;
  /** Optional weight in the overall score (used for visual emphasis only). */
  weight?: number;
};

export type FitScoreLabels = {
  title: string;
  scoreAria: (value: number) => string;
  breakdownTitle: string;
  matchedTitle: string;
  missingTitle: string;
  teaserTitle: string;
  teaserBody: string;
  teaserCta: string;
};
