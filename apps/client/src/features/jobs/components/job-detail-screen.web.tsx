import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { JobDesktopDetail } from "./job-desktop-detail.web";
import { JobMobileDetail } from "./job-mobile-detail";

export function JobDetailScreen({ id }: { id: string }) {
  return useIsDesktopWeb() ? (
    <JobDesktopDetail key={id} id={id} />
  ) : (
    <JobMobileDetail key={id} id={id} />
  );
}
