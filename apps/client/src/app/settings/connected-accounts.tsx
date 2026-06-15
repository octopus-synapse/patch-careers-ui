/** Connected OAuth accounts — list + disconnect (backend guards last login). */

import {
  useDeleteV1UsersConnectedAccountsProvider,
  useGetV1UsersConnectedAccounts,
} from "@patch-careers/api-client";
import type { OAuthProvider } from "@patch-careers/auth";
import { OAuthButton, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useOAuthSignIn } from "@/components/auth/hooks/use-oauth-sign-in";
import { GithubGlyph, GoogleGlyph, LinkedinGlyph } from "@/components/auth/oauth-glyphs";
import { SettingsCard, SettingsScreenShell, useSet } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Linkable providers — same glyphs/handler the sign-in OAuth row uses (DRY). */
const PROVIDERS = [
  { id: "github", label: "GitHub", icon: GithubGlyph },
  { id: "linkedin", label: "LinkedIn", icon: LinkedinGlyph },
  { id: "google", label: "Google", icon: GoogleGlyph },
] as const satisfies readonly {
  id: OAuthProvider;
  label: string;
  icon: typeof GithubGlyph;
}[];

export default function ConnectedAccountsScreen(): ReactElement {
  const { t } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const query = useGetV1UsersConnectedAccounts();
  const disconnect = useDeleteV1UsersConnectedAccountsProvider();
  const { handleOAuth } = useOAuthSignIn();
  const [target, setTarget] = useState<string | null>(null);

  const accounts = query.data?.accounts ?? [];
  const available = PROVIDERS.filter((p) => !accounts.some((a) => a.provider === p.id));

  const doDisconnect = (): void => {
    if (!target) return;
    disconnect.mutate(
      { provider: target },
      {
        onSettled: () => {
          setTarget(null);
          void query.refetch();
        },
      },
    );
  };

  return (
    <SettingsScreenShell title={t("settings.account.connected.title")}>
      {query.isLoading ? (
        <ActivityIndicator color={palette.ink} style={{ marginTop: 24 }} />
      ) : (
        <>
          {accounts.length > 0 ? (
            <SettingsCard>
              {accounts.map((a, i) => (
                <View key={a.provider} style={[styles.row, i > 0 ? styles.rowDivider : null]}>
                  <Text style={styles.rowLabel}>{cap(a.provider)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setTarget(a.provider)}
                    hitSlop={8}
                  >
                    <Text style={{ color: palette.danger, fontSize: 14 }}>
                      {t("settings.account.connected.disconnect")}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </SettingsCard>
          ) : null}

          {available.length > 0 ? (
            <View>
              <Text style={[styles.sectionHeader, { textTransform: "uppercase" }]}>
                {t("settings.account.connected.connect")}
              </Text>
              {available.map((p, i) => (
                <OAuthButton
                  key={p.id}
                  icon={p.icon}
                  delay={(i + 1) * 100}
                  label={t("settings.account.connected.connectWith", { provider: p.label })}
                  onPress={() => void handleOAuth(p.id)}
                  testID={`settings.connect.${p.id}`}
                />
              ))}
            </View>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={target != null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        danger
        title={t("settings.account.connected.disconnectConfirmTitle", {
          provider: target ? cap(target) : "",
        })}
        description={t("settings.account.connected.disconnectConfirmBody", {
          provider: target ? cap(target) : "",
        })}
        confirmLabel={t("settings.account.connected.disconnect")}
        onConfirm={doDisconnect}
      />
    </SettingsScreenShell>
  );
}
