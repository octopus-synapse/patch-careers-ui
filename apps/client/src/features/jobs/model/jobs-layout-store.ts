import { createPersistedStore } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";

export type JobsLayout = "list" | "grid";

type JobsLayoutData = {
  layouts: Record<string, JobsLayout>;
};

type JobsLayoutActions = {
  setLayout: (userId: string, layout: JobsLayout) => void;
};

const isLayout = (value: unknown): value is JobsLayout => value === "list" || value === "grid";

export const useJobsLayoutStore = createPersistedStore<JobsLayoutData, JobsLayoutActions>({
  key: "patch-careers:jobs-layout",
  version: 1,
  storage: mundane,
  initialData: { layouts: {} },
  createActions: (set) => ({
    setLayout: (userId, layout) =>
      set((state) => ({ layouts: { ...state.layouts, [userId]: layout } })),
  }),
  validate: (persisted) => {
    if (!persisted || typeof persisted !== "object" || !("layouts" in persisted)) return null;
    const raw = persisted.layouts;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const layouts = Object.fromEntries(
      Object.entries(raw).filter((entry): entry is [string, JobsLayout] => isLayout(entry[1])),
    );
    return { layouts };
  },
});
