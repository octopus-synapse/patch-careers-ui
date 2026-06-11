/**
 * Resume detail route — slides in over the tabs (no tab bar, no AppHeader),
 * mirroring `job/[id]`. Data resolution and the not-found fallback live in
 * `ResumeDetailScreen`.
 */

import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { ResumeDetailScreen } from "@/features/resumes";

export default function ResumeDetailRoute(): ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? "") : (params.id ?? "");
  return <ResumeDetailScreen id={id} />;
}
