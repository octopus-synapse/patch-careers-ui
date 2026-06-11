/**
 * Job detail route — slides in over the tabs (no tab bar, no AppHeader),
 * mirroring `conversation/[id]`. Data resolution and the not-found fallback
 * live in `JobDetailScreen`.
 */

import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { JobDetailScreen } from "@/features/jobs";

export default function JobDetailRoute(): ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? "") : (params.id ?? "");
  return <JobDetailScreen id={id} />;
}
