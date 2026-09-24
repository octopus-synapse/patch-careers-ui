import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useAppRouter } from "@/navigation/use-app-router";

export default function LegacyJobListRedirect() {
  const router = useAppRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const raw = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  useEffect(() => {
    if (raw === "applications") router.replace("/applications");
    else
      router.replace({
        pathname: "/jobs",
        params: { scope: raw === "saved" ? "saved" : "all" },
      });
  }, [raw, router]);
  return null;
}
