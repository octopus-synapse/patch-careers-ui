/**
 * `useEnumLabel` — enum values → labels, from the server (decision 28).
 *
 * `GET /v1/enums/:key` is the one dictionary the backend validates against;
 * the static table Kubb bakes into the SDK (`labelFor`) is a snapshot of it
 * taken at generation time. The server wins when it answers; the snapshot
 * covers the first paint and any failure, so a label never comes back as a
 * raw `FULL_TIME`. Cached for the session — enums do not change under a
 * running app.
 */
import { labelFor, useGetV1EnumsKey } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { useI18n } from "@/providers/i18n-provider";

type LabelledEnum = "JobType" | "RemotePolicy";

export function useEnumLabel(enumName: LabelledEnum): (value: string) => string {
  const { locale } = useI18n();
  const query = useGetV1EnumsKey(enumName, {
    query: { staleTime: Number.POSITIVE_INFINITY, retry: 1 },
  });
  const fromServer = new Map<string, string>();
  for (const entry of query.data?.values ?? []) {
    fromServer.set(entry.value, entry.labels[locale as Locale] ?? entry.labels.en);
  }
  return (value: string) => fromServer.get(value) ?? labelFor(enumName, value, locale);
}
