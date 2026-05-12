// Landing page is indexable — override the layout's `ssr = false` so the
// initial HTML carries the hero, plan features, FAQ, and `<SeoHead>` meta
// tags. The page renders purely from hard-coded content, so enabling SSR
// has no data-fetching implications.
export const ssr = true;
