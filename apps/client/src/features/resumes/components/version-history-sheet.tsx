/**
 * <VersionHistorySheet> — the snapshots a résumé has accumulated, and the way
 * back to one.
 *
 * Snapshots were already being taken on every update; nothing could read
 * them, so an accidental delete of a section was permanent from the app's
 * point of view. This is that safety net, made reachable.
 *
 * Restoring is itself an update, so it takes its own snapshot first: the
 * state you are leaving stays on the list.
 */

import {
  getV1ResumesResumeIdQueryKey,
  getV1ResumesResumeIdSectionsQueryKey,
  useGetV1ResumesResumeIdVersions,
  usePostV1ResumesResumeIdVersionsVersionIdRestore,
} from "@patch-careers/api-client";
import { Sheet, Text, useToast, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useI18n } from "@/providers/i18n-provider";
import { useRz } from "../lib/styles";

type Version = {
  id: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
};

export function VersionHistorySheet({
  open,
  onClose,
  resumeId,
}: {
  open: boolean;
  onClose: () => void;
  resumeId: string;
}): ReactElement {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const rz = useRz();
  const toast = useToast();
  const queryClient = useQueryClient();

  const versions = useGetV1ResumesResumeIdVersions(resumeId, {
    query: { enabled: open },
  });
  const restore = usePostV1ResumesResumeIdVersionsVersionIdRestore();
  const [target, setTarget] = useState<Version | null>(null);

  const rows = (versions.data?.versions ?? []) as Version[];

  const doRestore = (): void => {
    if (!target) return;
    restore.mutate(
      { resumeId, versionId: target.id },
      {
        onSuccess: async () => {
          setTarget(null);
          onClose();
          toast.show({ title: t("resumes.versions.restored"), intent: "success" });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getV1ResumesResumeIdQueryKey(resumeId) }),
            queryClient.invalidateQueries({
              queryKey: getV1ResumesResumeIdSectionsQueryKey(resumeId),
            }),
          ]);
        },
        onError: () => {
          setTarget(null);
          toast.show({ title: t("resumes.versions.restoreFailed"), intent: "danger" });
        },
      },
    );
  };

  const labelFor = (version: Version): string =>
    version.label ?? t("resumes.versions.numbered", { number: version.versionNumber });

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={t("resumes.versions.title")}
      >
        <YStack gap={14} paddingBottom={8}>
          <Text fontFamily={fonts.sans} fontSize={13} lineHeight={18} color={palette.body}>
            {t("resumes.versions.intro")}
          </Text>

          {versions.isLoading ? (
            <ActivityIndicator color={palette.ink} />
          ) : versions.isError ? (
            <Text fontFamily={fonts.sans} fontSize={13} color={palette.danger}>
              {t("resumes.versions.loadError")}
            </Text>
          ) : rows.length === 0 ? (
            <Text fontFamily={fonts.sans} fontSize={13} color={palette.muted}>
              {t("resumes.versions.empty")}
            </Text>
          ) : (
            rows.map((version) => (
              <View key={version.id} style={rz.metaRow}>
                <View style={rz.versionRowBody}>
                  <Text fontFamily={fonts.sans} fontSize={14} color={palette.ink}>
                    {labelFor(version)}
                  </Text>
                  <Text fontFamily={fonts.sans} fontSize={12} color={palette.muted}>
                    {new Date(version.createdAt).toLocaleString(locale)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("resumes.versions.restoreA11y", {
                    label: labelFor(version),
                  })}
                  onPress={() => setTarget(version)}
                >
                  <Text fontFamily={fonts.sans} fontSize={13} color={palette.accent}>
                    {t("resumes.versions.restore")}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </YStack>
      </Sheet>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(next) => {
          if (!next) setTarget(null);
        }}
        title={t("resumes.versions.confirmTitle", { label: target ? labelFor(target) : "" })}
        description={t("resumes.versions.confirmBody")}
        confirmLabel={t("resumes.versions.restore")}
        loading={restore.isPending}
        onConfirm={doRestore}
      />
    </>
  );
}
