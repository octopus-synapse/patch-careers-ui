import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { JobsDesktopScreen } from "./jobs-desktop-screen.web";
import { JobsMobileScreen } from "./jobs-mobile-screen";

export function JobsHomeScreen() {
  return useIsDesktopWeb() ? <JobsDesktopScreen /> : <JobsMobileScreen />;
}
