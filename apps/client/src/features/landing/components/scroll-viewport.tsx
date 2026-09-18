import type { ReactElement, ReactNode } from "react";
import type { ChapterDeck } from "../hooks/use-chapter-deck";

export interface ScrollViewportProps {
  readonly deck: ChapterDeck;
  readonly height: number;
  readonly paused: boolean;
  readonly children: ReactNode;
}

export function ScrollViewport({ children }: ScrollViewportProps): ReactElement {
  return <>{children}</>;
}
