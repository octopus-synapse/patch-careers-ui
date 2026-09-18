import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { JobsDesktopScreen } from "./jobs-desktop-screen.web";
import { JobsHomeScreen as LegacyJobsHomeScreen } from "./jobs-home-legacy";

export function JobsHomeScreen() {
  return useIsDesktopWeb() ? <JobsDesktopScreen /> : <LegacyJobsHomeScreen />;
}
