import { Text, useEditorialPalette, XStack, YStack } from "@patch-careers/ui";
import { PillButton } from "@patch-careers/ui/editorial";
import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { AppLink } from "@/navigation/app-link";
import { useI18n } from "@/providers/i18n-provider";
import { useApplicationsBoard } from "../hooks/use-applications-board";
import {
  type Opportunity,
  PREPARATION_STAGES,
  type PreparationStage,
  type WorkspaceEntry,
} from "../lib/discovery";
import { JobLogo } from "./job-logo";
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
  const board = useApplicationsBoard(entries, workspaceLoading);
  const rows = board.rows;
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  if (board.isLoading) return <ActivityIndicator color={palette.accent} />;
  if (board.isError)
    return (
      <JobsEmpty
        title={t("jobs.desktop.loadError")}
        action={<PillButton label={t("common.retry")} onPress={board.refetch} />}
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
          // biome-ignore lint/a11y/noStaticElementInteractions: drag is an optional pointer shortcut; the select remains the keyboard-accessible control.
          <div
            key={stage}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              const row = rows.find((candidate) => candidate.key === draggingKey);
              setDraggingKey(null);
              if (row?.job && row.stage !== stage) void onChange(row.job, stage);
            }}
            // @style-allow inline: native-style props cannot express the min-width reset on this HTML drop target.
            style={{ minWidth: 0 }}
          >
            <YStack
              backgroundColor={palette.surface}
              borderRadius={15}
              minHeight={300}
              padding={13}
              gap={14}
              borderWidth={draggingKey ? 1 : 0}
              borderColor={draggingKey ? palette.accent : "transparent"}
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
                  // biome-ignore lint/a11y/noStaticElementInteractions: drag is an optional pointer shortcut; the select remains the keyboard-accessible control.
                  <div
                    key={row.key}
                    draggable={Boolean(row.job && !row.closed)}
                    onDragStart={() => setDraggingKey(row.key)}
                    onDragEnd={() => setDraggingKey(null)}
                    style={{ cursor: row.job && !row.closed ? "grab" : "default" }}
                  >
                    <YStack
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
                        <AppLink href={{ pathname: "/job/[id]", params: { id: row.id } }}>
                          <Text fontSize={14} lineHeight={21} fontWeight="600" color={palette.ink}>
                            {row.title}
                          </Text>
                        </AppLink>
                      ) : (
                        <Text fontSize={14} lineHeight={21} fontWeight="600" color={palette.ink}>
                          {row.title}
                        </Text>
                      )}
                      {row.documentCount ? (
                        <Text fontSize={11} color={palette.muted}>
                          {t("jobs.desktop.documentCount", { count: row.documentCount })}
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
                  </div>
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
          </div>
        ))}
      </div>
    </YStack>
  );
}
