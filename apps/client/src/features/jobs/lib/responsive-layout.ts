export type JobsViewport = {
  presentation: "compact" | "desktop";
  canChooseLayout: boolean;
  gridColumns: 1 | 2 | 4;
};

export function jobsViewport(width: number): JobsViewport {
  if (width >= 1024) return { presentation: "desktop", canChooseLayout: true, gridColumns: 4 };
  if (width >= 768) return { presentation: "compact", canChooseLayout: true, gridColumns: 2 };
  return { presentation: "compact", canChooseLayout: false, gridColumns: 1 };
}
