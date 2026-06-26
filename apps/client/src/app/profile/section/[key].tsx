import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { SectionDetailScreen } from "@/features/profile";

export default function SectionRoute(): ReactElement {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <SectionDetailScreen sectionKey={key ?? ""} />;
}
