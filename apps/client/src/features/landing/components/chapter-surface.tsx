import type { ReactElement, ReactNode } from "react";

export interface ChapterSurfaceProps {
  readonly children: ReactNode;
  readonly active: boolean;
}
export function ChapterSurface({ children }: ChapterSurfaceProps): ReactElement {
  return <>{children}</>;
}
