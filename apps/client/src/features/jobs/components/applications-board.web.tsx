import { Text, useEditorialPalette, XStack, YStack } from "@patch-careers/ui";
import { PillButton } from "@patch-careers/ui/editorial";
import { Link } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useExternalJobs } from "../hooks/queries";
import { useApplications, useApplicationTimeline } from "../hooks/use-applications";
import {
  type Opportunity,
  PREPARATION_STAGES,
  type PreparationStage,
  type WorkspaceEntry,
} from "../lib/discovery";
import { EMPTY_JOBS_FILTERS } from "../types";
import { JobLogo } from "./job-logo.web";
import { JobsEmpty } from "./job-shelf.web";

export function ApplicationsBoard({
  entries,
  workspaceLoading,
  onChange,
}: {
  entries: WorkspaceEntry[];
  workspaceLoading: boolean;
  onChange: (job: Opportunity, stage: PreparationStage) => Promise<void>;
}) {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const applications = useApplications(true);
  const saved = useExternalJobs(EMPTY_JOBS_FILTERS, "saved");
  const tracker = useApplicationTimeline();
  const rows: {
    key: string;
    job: Opportunity | null;
    title: string;
    company: string;
    stage: PreparationStage;
    count: number;
    id: string;
    closed: boolean;
  }[] = entries
    .filter((entry) => entry.stage !== null)
    .map((entry) => ({
      key: entry.job.externalId,
      job: entry.job as Opportunity,
      title: entry.job.title,
      company: entry.job.company,
      stage: entry.stage as PreparationStage,
      count: entry.documents.length,
      id: entry.job.id,
      closed: false,
    }));
  for (const application of applications.sections.flatMap((section) => section.data)) {
    const job =
      saved.jobs.find(
        (job) => job.id === application.jobRouteId || job.savedId === application.jobRouteId,
      ) ?? application.job;
    const timeline = tracker.data?.applications.find(
      (item) => `internal-${item.id}` === application.id,
    );
    const interview = timeline?.events.some((event) =>
      ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER_RECEIVED"].includes(event.type),
    );
    const existing = rows.find((row) => job && row.key === job.externalId);
    if (existing) {
      existing.closed = application.status === "closed";
      continue;
    }
    rows.push({
      key: application.id,
      job: job ?? null,
      title: application.title,
      company: application.company,
      stage: interview ? "interview" : "sent",
      count: 0,
      id: job?.id ?? "",
      closed: application.status === "closed",
    });
  }
  if (applications.isLoading || workspaceLoading)
    return <ActivityIndicator color={palette.accent} />;
  if (applications.isError)
    return (
      <JobsEmpty
        title={t("jobs.desktop.loadError")}
        action={<PillButton label={t("common.retry")} onPress={applications.refetch} />}
      />
    );
  return (
    <YStack gap={24}>
      <Text fontSize={12} color={palette.muted}>
        {t("jobs.desktop.applicationHelp")}
      </Text>
      {/* @style-allow inline: four fixed desktop kanban columns, independent of their card counts. */}
      <div
        // @style-allow inline: CSS grid keeps four kanban columns independent of card counts.
        style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18 }}
      >
        {PREPARATION_STAGES.map((stage) => (
          <YStack
            key={stage}
            backgroundColor={palette.surface}
            borderRadius={15}
            minHeight={300}
            padding={13}
            gap={14}
          >
            <XStack alignItems="center" justifyContent="space-between" gap={8} padding={3}>
              <Text accessibilityRole="header" fontSize={13} fontWeight="600" color={palette.ink}>
                {t(`jobs.desktop.stage.${stage}`)}
              </Text>
              <Text fontSize={11} color={palette.muted}>
                {rows.filter((row) => row.stage === stage).length}
              </Text>
            </XStack>
            {rows
              .filter((row) => row.stage === stage)
              .map((row) => (
                <YStack
                  key={row.key}
                  borderRadius={12}
                  borderWidth={1}
                  borderColor={palette.hairline}
                  backgroundColor={palette.panel}
                  padding={16}
                  gap={12}
                >
                  <XStack alignItems="center" gap={9}>
                    <JobLogo job={row.job ?? { company: row.company }} />
                    <Text fontSize={11} color={palette.muted} flex={1}>
                      {row.company}
                    </Text>
                  </XStack>
                  {row.id ? (
                    <Link href={{ pathname: "/job/[id]", params: { id: row.id } }}>
                      <Text fontSize={14} lineHeight={21} fontWeight="600" color={palette.ink}>
                        {row.title}
                      </Text>
                    </Link>
                  ) : (
                    <Text fontSize={14} lineHeight={21} fontWeight="600" color={palette.ink}>
                      {row.title}
                    </Text>
                  )}
                  {row.count ? (
                    <Text fontSize={11} color={palette.muted}>
                      {t("jobs.desktop.documentCount", { count: row.count })}
                    </Text>
                  ) : null}
                  {row.closed ? (
                    <Text fontSize={11} color={palette.muted}>
                      {t("jobs.applications.status.closed")}
                    </Text>
                  ) : row.job ? (
                    <select
                      aria-label={t("jobs.desktop.changeStage", { title: row.title })}
                      value={stage}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (row.job && PREPARATION_STAGES.includes(next as PreparationStage))
                          void onChange(row.job, next as PreparationStage);
                      }}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 8,
                        border: `1px solid ${palette.hairlineStrong}`,
                        backgroundColor: palette.panel,
                        color: palette.body,
                        font: "inherit",
                        fontSize: 11,
                      }}
                    >
                      {PREPARATION_STAGES.map((option) => (
                        <option key={option} value={option}>
                          {t(`jobs.desktop.stage.${option}`)}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </YStack>
              ))}
            {!rows.some((row) => row.stage === stage) ? (
              <Text
                fontSize={11}
                lineHeight={19}
                color={palette.muted}
                textAlign="center"
                paddingVertical={35}
              >
                {t("jobs.desktop.emptyStage")}
              </Text>
            ) : null}
          </YStack>
        ))}
      </div>
    </YStack>
  );
}
