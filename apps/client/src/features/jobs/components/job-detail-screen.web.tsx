import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { JobDesktopDetail } from "./job-desktop-detail.web";
import { JobDetailScreen as LegacyJobDetail } from "./job-detail-legacy";

export function JobDetailScreen({ id }: { id: string }) {
  return useIsDesktopWeb() ? (
    <JobDesktopDetail key={id} id={id} />
  ) : (
    <LegacyJobDetail key={id} id={id} />
  );
}
