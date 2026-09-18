import type { ReactElement, ReactNode } from "react";

export interface DepthSurfaceProps {
  readonly children: ReactNode;
  readonly maxWidth?: number;
}

export function DepthSurface({ children }: DepthSurfaceProps): ReactElement {
  return <>{children}</>;
}
