/** Blocked users — list + unblock. */

import { useDeleteV1ChatBlockedUserId, useGetV1ChatBlocked } from "@patch-careers/api-client";
import { Avatar, YStack } from "@patch-careers/ui";
import { SettingsCard, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { useSet } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

type Blocked = {
  id: string;
  name?: string | null;
  photoURL?: string | null;
  username?: string | null;
};

export default function BlockedScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const query = useGetV1ChatBlocked();
  const unblock = useDeleteV1ChatBlockedUserId();
  const [target, setTarget] = useState<Blocked | null>(null);

  const blocked = (query.data?.blockedUsers ?? []) as Blocked[];

  const doUnblock = (): void => {
    if (!target) return;
    unblock.mutate(
      { userId: target.id },
      {
        onSettled: () => {
          setTarget(null);
          void query.refetch();
        },
      },
    );
  };

  return (
    <SettingsScreenShell title={t("settings.privacy.blocked.title")}>
      {query.isLoading ? (
        <YStack marginTop={24}>
          <ActivityIndicator color={palette.ink} />
        </YStack>
      ) : blocked.length === 0 ? (
        <YStack paddingTop={32} alignItems="center" gap={6}>
          <Text style={[styles.rowLabel, { flex: 0, textAlign: "center" }]}>
            {t("settings.privacy.blocked.empty")}
          </Text>
          <Text style={[styles.bodyText, { textAlign: "center" }]}>
            {t("settings.privacy.blocked.emptyDescription")}
          </Text>
        </YStack>
      ) : (
        <SettingsCard>
          {blocked.map((b, i) => (
            <View key={b.id} style={[styles.row, i > 0 ? styles.rowDivider : null]}>
              <Avatar src={b.photoURL ?? undefined} name={b.name ?? ""} size="sm" />
              <YStack flex={1}>
                <Text style={[styles.rowLabel, { flex: 0 }]} numberOfLines={1}>
                  {b.name ?? ""}
                </Text>
                {b.username ? (
                  <Text style={styles.rowValue} numberOfLines={1}>{`@${b.username}`}</Text>
                ) : null}
              </YStack>
              <Pressable accessibilityRole="button" onPress={() => setTarget(b)} hitSlop={8}>
                <Text style={{ color: palette.accent, fontSize: 14 }}>
                  {t("settings.privacy.blocked.unblock")}
                </Text>
              </Pressable>
            </View>
          ))}
        </SettingsCard>
      )}

      <ConfirmDialog
        open={target != null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title={t("settings.privacy.blocked.unblockConfirmTitle", { name: target?.name ?? "" })}
        description={t("settings.privacy.blocked.unblockConfirmBody")}
        confirmLabel={t("settings.privacy.blocked.unblock")}
        onConfirm={doUnblock}
      />
    </SettingsScreenShell>
  );
}
