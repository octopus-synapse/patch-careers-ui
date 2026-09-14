/**
 * Settings → Privacy → "Terms and privacy".
 *
 * The initial acceptance is recorded at signup: the payload carries the two
 * versions and the backend persists both consents with IP and user agent.
 * What had no path was the *second* acceptance — when a published version
 * changes, nothing asked and nothing recorded. This screen is that path:
 * it shows which document is behind, accepts the new version on request,
 * and lists the audit trail the law expects the person to be able to see.
 */

import {
  acceptConsent,
  type GetConsentHistoryQueryResponse,
  type GetConsentStatusQueryResponse,
  getConsentHistory,
  getConsentStatus,
} from "@patch-careers/api-client";
import { useToast, YStack } from "@patch-careers/ui";
import { PrimaryAction, SettingsCard, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { SectionHeader, useSet } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

type DocumentType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";

const STATUS_KEY = ["consent", "status"] as const;
const HISTORY_KEY = ["consent", "history"] as const;

export default function ConsentScreen(): ReactElement {
  const { t, locale } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const toast = useToast();
  const queryClient = useQueryClient();

  const status = useQuery<GetConsentStatusQueryResponse>({
    queryKey: STATUS_KEY,
    queryFn: () => getConsentStatus(),
  });
  const history = useQuery<GetConsentHistoryQueryResponse>({
    queryKey: HISTORY_KEY,
    queryFn: () => getConsentHistory(),
  });

  const accept = useMutation({
    mutationFn: (documentType: DocumentType) => acceptConsent({ documentType }),
    onSuccess: async () => {
      toast.show({ title: t("settings.consent.accepted"), intent: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
        queryClient.invalidateQueries({ queryKey: HISTORY_KEY }),
      ]);
    },
    onError: () => toast.show({ title: t("settings.consent.acceptFailed"), intent: "danger" }),
  });

  const documents: Array<{
    type: DocumentType;
    label: string;
    accepted: boolean;
    version: string;
  }> = status.data
    ? [
        {
          type: "TERMS_OF_SERVICE",
          label: t("settings.consent.terms"),
          accepted: status.data.tosAccepted,
          version: status.data.latestTosVersion,
        },
        {
          type: "PRIVACY_POLICY",
          label: t("settings.consent.privacy"),
          accepted: status.data.privacyPolicyAccepted,
          version: status.data.latestPrivacyPolicyVersion,
        },
      ]
    : [];

  const entries = history.data ?? [];

  return (
    <SettingsScreenShell
      title={t("settings.consent.title")}
      description={t("settings.consent.description")}
    >
      {status.isLoading ? (
        <YStack marginTop={24}>
          <ActivityIndicator color={palette.ink} />
        </YStack>
      ) : status.isError ? (
        <Text style={styles.bodyText}>{t("settings.consent.loadError")}</Text>
      ) : (
        <SettingsCard>
          {documents.map((doc, index) => (
            <View key={doc.type} style={[styles.stackedRow, index === 0 && styles.stackedRowFirst]}>
              <View style={styles.stackedRowBody}>
                <Text style={styles.rowLabel}>{doc.label}</Text>
                <Text style={styles.bodyText}>
                  {doc.accepted
                    ? t("settings.consent.upToDate", { version: doc.version })
                    : t("settings.consent.outdated", { version: doc.version })}
                </Text>
              </View>
              {doc.accepted ? null : (
                <PrimaryAction
                  label={t("settings.consent.accept")}
                  loading={accept.isPending && accept.variables === doc.type}
                  onPress={() => accept.mutate(doc.type)}
                />
              )}
            </View>
          ))}
        </SettingsCard>
      )}

      <SectionHeader label={t("settings.consent.historyLabel")} />
      {history.isLoading ? (
        <YStack marginTop={12}>
          <ActivityIndicator color={palette.ink} />
        </YStack>
      ) : entries.length === 0 ? (
        <Text style={styles.bodyText}>{t("settings.consent.historyEmpty")}</Text>
      ) : (
        <SettingsCard>
          {entries.map((entry, index) => (
            <View key={entry.id} style={[styles.stackedRow, index === 0 && styles.stackedRowFirst]}>
              <View style={styles.stackedRowBody}>
                <Text style={styles.rowLabel}>
                  {entry.documentType === "TERMS_OF_SERVICE"
                    ? t("settings.consent.terms")
                    : entry.documentType === "PRIVACY_POLICY"
                      ? t("settings.consent.privacy")
                      : t("settings.consent.marketing")}
                </Text>
                <Text style={styles.bodyText}>
                  {t("settings.consent.historyLine", {
                    version: entry.version,
                    date: new Date(entry.acceptedAt).toLocaleDateString(locale),
                  })}
                </Text>
              </View>
            </View>
          ))}
        </SettingsCard>
      )}
    </SettingsScreenShell>
  );
}
